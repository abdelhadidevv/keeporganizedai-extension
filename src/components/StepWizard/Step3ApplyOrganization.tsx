/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable operator-linebreak */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, Tag, FileCheck, Download, ArrowRight, Check } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState/LoadingState';
import { ErrorState } from '@/components/ErrorState/ErrorState';
import { useWizardStore } from '@/store';
import { getBookmarkTree, createFolder, moveBookmark, deleteBookmark } from '@/services/bookmarks';
import { backupService } from '@/services/backup';
import { aiService } from '@/services/ai';
import { getSync, STORAGE_KEYS } from '@/services/storage';
import { AIProvider } from '@/types';
import { Button } from '@/components/ui/Button/Button';

interface BookmarkInfo {
  id: string;
  title: string;
  url: string;
  parentId?: string;
}

interface Step3Props {
  onComplete: () => void;
}

export function Step3ApplyOrganization({ onComplete }: Step3Props) {
  const categories = useWizardStore((s) => s.categories);
  const lockStates = useWizardStore((s) => s.lockStates);
  const applyPhase = useWizardStore((s) => s.applyPhase);
  const setApplyPhase = useWizardStore((s) => s.setApplyPhase);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [assignmentSummary, setAssignmentSummary] = useState<
    Record<string, { categoryName: string; count: number }>
  >({});
  const isApplyingRef = useRef(false);

  const collectUnlockedBookmarks = useCallback(async (): Promise<BookmarkInfo[]> => {
    const tree = await getBookmarkTree();
    const hardLockedFolderIds = new Set(
      Object.entries(lockStates)
        .filter(([, t]) => t === 'hard')
        .map(([id]) => id)
    );
    const smartLockedFolderIds = new Set(
      Object.entries(lockStates)
        .filter(([, t]) => t === 'smart')
        .map(([id]) => id)
    );
    const unlockedBookmarks: BookmarkInfo[] = [];

    const collect = (nodes: chrome.bookmarks.BookmarkTreeNode[], parentId?: string): void => {
      nodes.forEach((node) => {
        if (!node.url && node.children) {
          if (!hardLockedFolderIds.has(node.id) && !smartLockedFolderIds.has(node.id)) {
            collect(node.children, node.id);
          }
        } else if (
          node.url &&
          !hardLockedFolderIds.has(parentId || '') &&
          !smartLockedFolderIds.has(parentId || '')
        ) {
          unlockedBookmarks.push({
            id: node.id,
            title: node.title,
            url: node.url,
            parentId,
          });
        }
      });
    };

    collect(tree);
    return unlockedBookmarks;
  }, [lockStates]);

  const applyOrganization = useCallback(async () => {
    if (isApplyingRef.current) return;
    isApplyingRef.current = true;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setStatusMessage('Starting organization…');
    setApplyPhase('collect');

    const provider = (await getSync<AIProvider>(STORAGE_KEYS.AI_PROVIDER)) || 'gemini';

    try {
      setProgress(10);
      setStatusMessage('Collecting bookmarks…');
      const bookmarks = await collectUnlockedBookmarks();

      if (bookmarks.length === 0) {
        throw new Error('No bookmarks found to organize');
      }

      setProgress(20);
      setStatusMessage(`Found ${bookmarks.length} bookmarks`);
      setApplyPhase('assign');

      setProgress(30);
      setStatusMessage('Assigning bookmarks to categories…');
      const assignments = await aiService.assignBookmarks(bookmarks, categories, provider);

      setProgress(40);
      setStatusMessage('Creating backup…');
      await backupService.createBackup();

      setProgress(50);
      setStatusMessage('Creating category folders…');
      setApplyPhase('apply');

      const categoryFolderIds: Record<string, string> = {};
      // eslint-disable-next-line no-restricted-syntax,no-await-in-loop
      for (const category of categories) {
        const folder = await createFolder(category.name, '1');
        categoryFolderIds[category.id] = folder.id;
      }

      setProgress(60);
      setStatusMessage('Moving bookmarks to categories…');
      let processed = 0;
      // eslint-disable-next-line no-restricted-syntax,no-await-in-loop
      for (const bookmark of bookmarks) {
        const assignment = assignments.find((a) => a.bookmarkId === bookmark.id);
        if (assignment && categoryFolderIds[assignment.categoryId]) {
          await moveBookmark(bookmark.id, categoryFolderIds[assignment.categoryId]);
        }
        processed += 1;
        setProgress(60 + Math.round((processed / bookmarks.length) * 25));
        setStatusMessage(`Moving bookmark ${processed} of ${bookmarks.length}…`);
      }

      setProgress(85);
      setStatusMessage('Cleaning up empty folders…');
      const tree = await getBookmarkTree();
      const hardLockedFolderIds = new Set(
        Object.entries(lockStates)
          .filter(([, t]) => t === 'hard')
          .map(([id]) => id)
      );

      const foldersToDelete: string[] = [];

      const collectFolders = (nodes: chrome.bookmarks.BookmarkTreeNode[]): void => {
        nodes.forEach((node) => {
          if (
            !node.url &&
            node.children &&
            !hardLockedFolderIds.has(node.id) &&
            !['0', '1', '2'].includes(node.id)
          ) {
            const hasBookmarks = node.children.some((c) => c.url);
            const hasSubfolders = node.children.some((c) => !c.url);
            if (!hasBookmarks && !hasSubfolders) foldersToDelete.push(node.id);
            else if (!hasBookmarks && hasSubfolders) collectFolders(node.children);
          }
          if (node.children && !hardLockedFolderIds.has(node.id)) collectFolders(node.children);
        });
      };

      collectFolders(tree);

      // eslint-disable-next-line no-restricted-syntax
      for (const folderId of foldersToDelete) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await deleteBookmark(folderId);
        } catch {
          // skip
        }
      }

      setProgress(90);
      setStatusMessage('Generating summary…');
      const summary: Record<string, { categoryName: string; count: number }> = {};
      assignments.forEach((a) => {
        const cat = categories.find((c) => c.id === a.categoryId);
        if (cat) {
          if (!summary[cat.id]) summary[cat.id] = { categoryName: cat.name, count: 0 };
          summary[cat.id].count += 1;
        }
      });

      setAssignmentSummary(summary);
      setProgress(100);
      setStatusMessage('Organization complete!');
      setApplyPhase('success');
    } catch (err) {
      isApplyingRef.current = false;
      const aiError = err as { message?: string; code?: string };
      const errorMessage =
        aiError.code === 'MISSING_API_KEY'
          ? `No API key configured for ${provider}. Please add your API key in Settings.`
          : aiError.message || 'Failed to apply organization';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [collectUnlockedBookmarks, categories, lockStates, setApplyPhase]);

  useEffect(() => {
    applyOrganization();
  }, []);

  const handleRetry = useCallback(() => {
    isApplyingRef.current = false;
    setError(null);
    setProgress(0);
    setAssignmentSummary({});
    setApplyPhase('collect');
    applyOrganization();
  }, [applyOrganization]);

  const handleDownloadBackup = useCallback(async () => {
    try {
      const backup = await backupService.getLatestBackup();
      if (backup) await backupService.exportAsDownload(backup);
    } catch {
      setError('Failed to download backup');
    }
  }, []);

  const handleViewResults = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (isLoading && applyPhase !== 'success') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center gap-6 p-12 flex-shrink-0">
          <LoadingState variant="dots" message={statusMessage} />
          <div className="w-full max-w-[280px]">
            <div className="h-[3px] bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-[12px] text-muted font-mono mt-2">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        retryAction={handleRetry}
        title="Failed to organize bookmarks"
        icon={<FileCheck className="w-6 h-6 text-[var(--color-error)]" />}
      />
    );
  }

  const totalAssignments = Object.values(assignmentSummary).reduce((s, v) => s + v.count, 0);

  if (applyPhase === 'success') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center gap-4 pb-4 flex-shrink-0">
          <div className="w-[72px] h-[72px] rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
            <Check className="w-9 h-9 text-[var(--color-success)]" />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
              Organization Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalAssignments} bookmark
              {totalAssignments !== 1 ? 's' : ''} organized into{' '}
              {Object.keys(assignmentSummary).length} categories
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadBackup}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download Backup
            </Button>
            <Button onClick={handleViewResults}>
              View Results
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-2">
            {Object.entries(assignmentSummary)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([categoryId, summary]) => {
                const cat = categories.find((c) => c.id === categoryId);
                const isLocked = cat?.isLocked || false;
                return (
                  <div
                    key={categoryId}
                    className="flex items-center gap-3 px-4 py-3 bg-muted/5 border border-muted/30 rounded-xl"
                  >
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" />
                    ) : (
                      <Tag className="w-3.5 h-3.5 text-muted shrink-0" />
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {summary.categoryName}
                    </span>
                    <span className="text-[12px] text-muted font-mono">
                      {summary.count} bookmark
                      {summary.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
