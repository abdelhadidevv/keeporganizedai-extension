/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable operator-linebreak */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Tag, FileCheck, Download, ArrowRight, Check, AlertCircle } from 'lucide-react';
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
  const { t } = useTranslation('wizard');
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
    setStatusMessage(t('step3.starting'));
    setApplyPhase('collect');

    const provider = (await getSync<AIProvider>(STORAGE_KEYS.AI_PROVIDER)) || 'gemini';

    try {
      setProgress(10);
      setStatusMessage(t('step3.collecting'));
      const bookmarks = await collectUnlockedBookmarks();

      if (bookmarks.length === 0) {
        throw new Error(t('step3.no_bookmarks'));
      }

      setProgress(20);
      setStatusMessage(t('step3.found_bookmarks', { count: bookmarks.length }));
      setApplyPhase('assign');
      setProgress(15);
      setStatusMessage(t('step3.assigning'));
      const result = await aiService.assignBookmarks(
        bookmarks,
        categories,
        (_, current, total) => {
          setProgress(15 + Math.round((current / total) * 55));
          setStatusMessage(t('step3.assigning_batch', { current, total }));
        },
        provider
      );
      const { assignments } = result;
      setProgress(72);
      setStatusMessage(t('step3.creating_backup'));
      await backupService.createBackup();

      setProgress(75);
      setStatusMessage(t('step3.creating_folders'));
      setApplyPhase('apply');

      const categoryFolderIds: Record<string, string> = {};
      // eslint-disable-next-line no-restricted-syntax,no-await-in-loop
      for (const category of categories) {
        const folder = await createFolder(category.name, '1');
        categoryFolderIds[category.id] = folder.id;
      }

      setProgress(77);
      setStatusMessage(t('step3.moving'));
      let processed = 0;
      // eslint-disable-next-line no-restricted-syntax,no-await-in-loop
      for (const bookmark of bookmarks) {
        const assignment = assignments.find((a) => a.bookmarkId === bookmark.id);
        if (assignment && categoryFolderIds[assignment.categoryId]) {
          await moveBookmark(bookmark.id, categoryFolderIds[assignment.categoryId]);
        }
        processed += 1;
        setProgress(77 + Math.round((processed / bookmarks.length) * 15));
        setStatusMessage(
          t('step3.moving_progress', { current: processed, total: bookmarks.length })
        );
      }

      setProgress(92);
      setStatusMessage(t('step3.cleaning'));
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

      setProgress(95);
      setStatusMessage(t('step3.generating_summary'));
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
      setStatusMessage(t('step3.complete'));
      setApplyPhase('success');
    } catch (err) {
      isApplyingRef.current = false;
      const aiError = err as { message?: string; code?: string };
      const errorMessage =
        aiError.code === 'MISSING_API_KEY'
          ? t('step3.no_api_key', { provider })
          : aiError.message || t('step3.failed_to_apply');
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
      await backupService.exportAsDownload();
    } catch {
      setError(t('step3.failed_to_download'));
    }
  }, []);

  const handleViewResults = useCallback(() => {
    onComplete();
  }, [onComplete]);

  if (isLoading && applyPhase !== 'success') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center justify-center gap-6 p-12 shrink-0">
          <LoadingState variant="dots" message={statusMessage} />
          <div className="w-full max-w-70">
            <div className="h-0.75 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-[12px] text-muted-foreground mt-2">{progress}%</p>
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
        title={t('step3.failed_to_apply')}
        icon={<FileCheck className="w-6 h-6 text-error" />}
      />
    );
  }

  const totalAssignments = Object.values(assignmentSummary).reduce((s, v) => s + v.count, 0);

  if (applyPhase === 'success') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col items-center gap-4 pb-4 shrink-0">
          <div className="w-18 h-18 rounded-full bg-primary-hover/10 flex items-center justify-center">
            <Check className="w-9 h-9 text-primary-hover" />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
              {t('step3.heading_complete')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('step3.summary_line_other', {
                count: totalAssignments,
                categories: Object.keys(assignmentSummary).length,
              })}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadBackup}>
              <Download className="w-3.5 h-3.5 me-1.5" />
              {t('step3.download_backup')}
            </Button>
            <Button onClick={handleViewResults}>
              {t('step3.view_results')}
              <ArrowRight className="w-3.5 h-3.5 ms-1.5 rtl:scale-x-[-1]" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <div className="w-full max-w-sm mx-auto flex flex-col gap-2">
            {Object.entries(assignmentSummary)
              .sort(([aId, a], [bId, b]) => {
                if (aId === 'skipped') return 1;
                if (bId === 'skipped') return -1;
                return b.count - a.count;
              })
              .map(([categoryId, summary]) => {
                const isSkipped = categoryId === 'skipped';
                const cat = isSkipped ? null : categories.find((c) => c.id === categoryId);
                const isLocked = cat?.isLocked || false;
                return (
                  <div
                    key={categoryId}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isSkipped
                        ? 'bg-error/5 border border-error/20'
                        : 'bg-muted/5 border border-muted/30'
                    }`}
                  >
                    {isSkipped ? (
                      <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-warning shrink-0" />
                    ) : (
                      <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`flex-1 text-sm font-medium ${
                        isSkipped ? 'text-error' : 'text-foreground'
                      }`}
                    >
                      {summary.categoryName}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {t('step3.bookmark_count_other', { count: summary.count })}
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
