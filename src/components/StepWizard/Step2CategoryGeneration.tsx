import { useTranslation } from 'react-i18next';
import { useWizardStore } from '@/store';
import { Category, AIProvider } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSync, STORAGE_KEYS } from '@/services/storage';
import { getBookmarkTree } from '@/services/bookmarks';
import { Info, Lock, Sparkles, Tag } from 'lucide-react';
import { aiService } from '@/services/ai';
import { LoadingState } from '@/components/LoadingState/LoadingState';
import { ErrorState } from '@/components/ErrorState/ErrorState';
import { Progress } from '@/components/ui/Progress/Progress';
import { createErrorState } from '@/states/presets';

export function Step2CategoryGeneration() {
  const { t } = useTranslation('wizard');
  const lockStates = useWizardStore((s) => s.lockStates);
  const categories = useWizardStore((s) => s.categories);
  const setCategories = useWizardStore((s) => s.setCategories);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title?: string; message: string } | null>(null);
  const [generatedCategories, setGeneratedCategories] = useState<Category[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
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

      const result = await aiService.generateCategories(
        unlockedBookmarks,
        smartLockedFolders,
        (_, current, total) => {
          setBatchCurrent(current);
          setBatchTotal(total);
        },
        provider
      );

      setGeneratedCategories(result.categories);
      if (result.categories.length > 0) {
        setCategories(result.categories);
      }
    } catch (err: any) {
      hasGeneratedRef.current = false;
      if (err?.code === 'MISSING_API_KEY') {
        const state = createErrorState(t, 'missingApiKey', undefined, { provider });
        setError(state);
      } else if (err?.code === 'OLLAMA_403_FORBIDDEN') {
        setError({ title: t('step2.ollama_403_title'), message: t('step2.ollama_403') });
      } else {
        setError({ message: err?.message || t('step2.failed_to_generate') });
      }
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
    const batchMessage =
      batchTotal > 0
        ? t('step2.batch_progress', { current: batchCurrent, total: batchTotal })
        : bookmarkCount > 0
          ? t('step2.analyzing', { count: bookmarkCount })
          : t('step2.analyzing_your');

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <LoadingState variant="dots" message={batchMessage} />
        {batchTotal > 0 && (
          <div className="w-full max-w-60">
            <Progress value={(batchCurrent / batchTotal) * 100} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} title={error.title} retryAction={handleRetry} />;
  }

  const displayCategories = generatedCategories.length > 0 ? generatedCategories : categories;
  const lockedCategories = displayCategories.filter((c) => c.isLocked);
  const aiCategories = displayCategories.filter((c) => !c.isLocked);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col items-start justify-between gap-4 pb-5 border-b border-muted/30">
        <div className="w-full flex justify-between items-center">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            {t('step2.heading')}
          </h3>
          <div className="flex items-center gap-1.5 font-medium text-primary bg-primary-light border border-primary/30 rounded-full p-1">
            <Tag className="w-3 h-3" />
            <span className="text-[13px]">{bookmarkCount}</span>
            <span className="text-[12px">{t('step2.bookmarks_label')}</span>
            <span className="text-muted-foreground text-[11px] mx-0.5">·</span>
            <span className="text-[13px]">{displayCategories.length}</span>
            <span className="text-[12px]">{t('step2.categories_label')}</span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {t('step2.description')}
        </p>
      </div>

      {displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
          <Tag className="w-10 h-10 opacity-40" />
          <p className="text-sm">{t('step2.no_categories')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-5">
          {lockedCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-3.5 h-3.5 text-warning" />
                <span className="text-[13px] font-semibold text-foreground">
                  {t('step2.protected_label', { count: lockedCategories.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lockedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-full text-[13px] font-medium text-warning"
                  >
                    <Lock className="w-[11px] h-[11px] text-warning" />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiCategories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">
                  {t('step2.ai_generated_label', { count: aiCategories.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="px-3 py-1.5 bg-background border border-muted/30 rounded-full text-[13px] font-medium text-foreground"
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-muted/30 text-[12px] text-muted-foreground">
            <Info className="w-3 h-3 shrink-0" />
            <span>{t('step2.footer_hint')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
