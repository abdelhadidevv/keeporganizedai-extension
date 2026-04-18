import { useWizardStore } from '@/store';
import { Category, AIProvider } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSync, STORAGE_KEYS } from '@/services/storage';
import { getBookmarkTree } from '@/services/bookmarks';
import { Info, Lock, Sparkles, Tag } from 'lucide-react';
import { aiService } from '@/services/ai';
import { LoadingState } from '@/components/LoadingState/LoadingState';
import { ErrorState } from '@/components/ErrorState/ErrorState';

export function Step2CategoryGeneration() {
  const lockStates = useWizardStore((s) => s.lockStates);
  const categories = useWizardStore((s) => s.categories);
  const setCategories = useWizardStore((s) => s.setCategories);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCategories, setGeneratedCategories] = useState<Category[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const hasGeneratedRef = useRef(false);

  const generateCategories = useCallback(async () => {
    if (hasGeneratedRef.current) return;
    if (categories.length > 0) {
      setGeneratedCategories(categories);
      return;
    }
    hasGeneratedRef.current = true;
    setIsLoading(true);
    setError(null);

    const provider = (await getSync<AIProvider>(STORAGE_KEYS.AI_PROVIDER)) || 'gemini';

    try {
      const tree = await getBookmarkTree();
      const hardLockedFolderIds = new Set(
        Object.entries(lockStates)
          .filter(([, t]) => t === 'hard')
          .map(([id]) => id)
      );

      const smartLockedFolders: string[] = [];
      const smartLockedFolderIds = new Set(
        Object.entries(lockStates)
          .filter(([, t]) => t === 'smart')
          .map(([id]) => id)
      );

      const collectSmartLockedFolderNames = (nodes: chrome.bookmarks.BookmarkTreeNode[]): void => {
        nodes.forEach((node) => {
          if (!node.url && node.children) {
            if (smartLockedFolderIds.has(node.id)) {
              smartLockedFolders.push(node.title || 'Untitled Folder');
            }
            collectSmartLockedFolderNames(node.children);
          }
        });
      };

      collectSmartLockedFolderNames(tree);

      const unlockedBookmarks: { id: string; title: string; url?: string }[] = [];

      const collectUnlocked = (
        nodes: chrome.bookmarks.BookmarkTreeNode[],
        parentId?: string
      ): void => {
        nodes.forEach((node) => {
          if (!node.url && node.children) {
            if (!hardLockedFolderIds.has(node.id) && !smartLockedFolderIds.has(node.id)) {
              collectUnlocked(node.children, node.id);
            }
          } else if (
            node.url &&
            !hardLockedFolderIds.has(parentId || '') &&
            !smartLockedFolderIds.has(parentId || '')
          ) {
            unlockedBookmarks.push({ id: node.id, title: node.title, url: node.url });
          }
        });
      };

      collectUnlocked(tree);
      setBookmarkCount(unlockedBookmarks.length);

      const generated = await aiService.generateCategories(
        unlockedBookmarks,
        smartLockedFolders,
        provider
      );

      setGeneratedCategories(generated);
      if (generated.length > 0) {
        setCategories(generated);
      }
    } catch (err) {
      hasGeneratedRef.current = false;
      const aiError = err as { message?: string; code?: string };
      const errorMessage =
        aiError.code === 'MISSING_API_KEY'
          ? `No API key configured for ${provider}. Please add your API key in Settings.`
          : aiError.message || 'Failed to generate categories';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [lockStates, categories, setCategories]);

  useEffect(() => {
    generateCategories();
  }, []);

  const handleRetry = useCallback(() => {
    hasGeneratedRef.current = false;
    setGeneratedCategories([]);
    setError(null);
    generateCategories();
  }, [generateCategories]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <LoadingState
          variant="dots"
          message={`Analyzing ${bookmarkCount > 0 ? bookmarkCount : 'your'} bookmarks…`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        retryAction={handleRetry}
        title="Failed to generate categories"
        icon={<Sparkles className="w-6 h-6 text-red-500" />}
      />
    );
  }

  const displayCategories = generatedCategories.length > 0 ? generatedCategories : categories;
  const lockedCategories = displayCategories.filter((c) => c.isLocked);
  const aiCategories = displayCategories.filter((c) => !c.isLocked);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900 dark:text-white mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Categories Generated
          </h3>
          <p className="text-[13px] leading-relaxed text-stone-500">
            AI has analyzed your bookmarks and created categories. Click Next to apply the
            organization.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1">
          <Tag className="w-3 h-3 text-indigo-600" />
          <span className="font-mono text-[13px] font-medium text-indigo-600">{bookmarkCount}</span>
          <span className="text-[12px] font-medium text-indigo-600">
            bookmark
            {bookmarkCount !== 1 ? 's' : ''}
          </span>
          <span className="text-stone-300 text-[11px] mx-0.5">·</span>
          <span className="font-mono text-[13px] font-medium text-indigo-600">
            {displayCategories.length}
          </span>
          <span className="text-[12px] font-medium text-indigo-600">
            categor
            {displayCategories.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>

      {displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-stone-400">
          <Tag className="w-10 h-10 opacity-40" />
          <p className="text-sm">No categories to display</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-5">
          {lockedCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[13px] font-semibold text-stone-800 dark:text-white">
                  Protected ({lockedCategories.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lockedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-full text-[13px] font-medium text-amber-800"
                  >
                    <Lock className="w-[11px] h-[11px] text-amber-500" />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[13px] font-semibold text-stone-800 dark:text-white">
                  AI-Generated ({aiCategories.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-[13px] font-medium text-stone-800"
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-stone-200 text-[12px] text-stone-400">
            <Info className="w-3 h-3 shrink-0" />
            <span>Click Next to apply this organization to your bookmarks.</span>
          </div>
        </div>
      )}
    </div>
  );
}
