/* eslint-disable operator-linebreak */
import { useWizardStore } from '@/store';
import { ChevronDown, ChevronRight, Folder, Loader2, Lock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getBookmarkTree } from '@/services/bookmarks';
import { LockType } from '@/types';
import { Button } from '@/components/ui/Button/Button';
import { LockToggle } from '@/components/LockToggle/LockToggle';

interface FlatFolder {
  id: string;
  title: string;
  parentId: string | undefined;
  depth: number;
  bookmarkCount: number;
  childCount: number;
}

interface FolderNode {
  id: string;
  title: string;
  parentId: string | undefined;
  depth: number;
  bookmarkCount: number;
  childCount: number;
  children: FolderNode[];
}

function countBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[]): number {
  return nodes.reduce((count, node) => {
    const hasUrl = node.url ? 1 : 0;
    const childCount = node.children ? countBookmarks(node.children) : 0;
    return count + hasUrl + childCount;
  }, 0);
}

function buildFolderTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  parentId: string | undefined,
  depth: number
): FolderNode[] {
  const result: FolderNode[] = [];

  nodes.forEach((node) => {
    if (!node.url && node.children) {
      if (depth === 0) {
        result.push(...buildFolderTree(node.children, undefined, 1));
      } else {
        const bookmarkCount = countBookmarks(node.children);
        const childFolders = node.children.filter((c) => !c.url);
        result.push({
          id: node.id,
          title: node.title || 'Untitled Folder',
          parentId,
          depth,
          bookmarkCount,
          childCount: childFolders.length,
          children: buildFolderTree(node.children, node.id, depth + 1),
        });
      }
    } else if (!node.url && !node.children) {
      result.push({
        id: node.id,
        title: node.title || 'Untitled Folder',
        parentId,
        depth,
        bookmarkCount: 0,
        childCount: 0,
        children: [],
      });
    }
  });

  return result;
}

function flattenVisibleFolders(nodes: FolderNode[], expandedIds: Set<string>): FlatFolder[] {
  const result: FlatFolder[] = [];

  nodes.forEach((node) => {
    result.push({
      id: node.id,
      title: node.title,
      parentId: node.parentId,
      depth: node.depth,
      bookmarkCount: node.bookmarkCount,
      childCount: node.childCount,
    });

    if (expandedIds.has(node.id) && node.children.length > 0) {
      result.push(...flattenVisibleFolders(node.children, expandedIds));
    }
  });

  return result;
}

export function Step1LockSelection() {
  const lockStates = useWizardStore((s) => s.lockStates);
  const setLockStates = useWizardStore((s) => s.setLockStates);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tree = await getBookmarkTree();
      const treeData = buildFolderTree(tree[0]?.children ?? [], undefined, 0);
      setFolderTree(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleLockChange = useCallback(
    (folderId: string, newLock: LockType) => {
      setLockStates({ ...lockStates, [folderId]: newLock });
    },
    [lockStates, setLockStates]
  );

  const toggleExpand = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const visibleFolders = flattenVisibleFolders(folderTree, expandedIds);
  const lockedCount = Object.values(lockStates).filter((l) => l !== 'none').length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <p className="text-sm text-stone-500">Loading folders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-sm text-red-500">
          Error:
          {error}
        </p>
        <Button onClick={loadFolders}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white mb-1">
            Lock folders to protect
          </h3>
          <p className="text-[13px] leading-relaxed text-muted max-w-[280px]">
            Lock folders to protect them from AI reorganization. All other folders will be
            organized.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-full px-3 py-1">
          <Lock className="w-3 h-3 text-[var(--color-primary)]" />
          <span className="font-mono text-[13px] font-medium text-[var(--color-primary)]">
            {lockedCount}
          </span>
          <span className="text-[12px] font-medium text-[var(--color-primary)]">
            {lockedCount !== 1 ? 'folders' : 'folder'}
            locked
          </span>
        </div>
      </div>

      <div className="flex-1 mt-4 border border-muted/20 rounded-xl bg-muted/5 overflow-y-auto">
        {visibleFolders.map((folder, idx) => {
          const isLocked = lockStates[folder.id] && lockStates[folder.id] !== 'none';
          const isHardLocked = lockStates[folder.id] === 'hard';
          const hasChildren = folder.childCount > 0;
          const isLast = idx === visibleFolders.length - 1;

          return (
            <div
              key={folder.id}
              className={[
                'flex items-center gap-3 py-3 pr-4 transition-colors duration-100',
                !isLast && 'border-b border-muted/10',
                isHardLocked && 'bg-[var(--color-warning)]/10',
                !isHardLocked && isLocked && 'bg-[var(--color-warning)]/5',
                !isHardLocked && !isLocked && 'hover:bg-muted/10',
              ].join(' ')}
              style={{ paddingLeft: 16 + folder.depth * 20 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(folder.id)}
                  className="w-[18px] h-[18px] flex items-center justify-center shrink-0 p-0 border-none bg-transparent cursor-pointer text-muted hover:text-foreground"
                >
                  {expandedIds.has(folder.id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <span className="w-[18px] shrink-0" />
              )}

              <div
                className={[
                  'w-8 h-8 flex items-center justify-center rounded-lg border shrink-0 transition-all duration-150',
                  isLocked
                    ? 'bg-[var(--color-warning)]/20 border-[var(--color-warning)]/30'
                    : 'bg-muted/10 border-muted/20',
                ].join(' ')}
              >
                <Folder
                  className={`w-[15px] h-[15px] ${isLocked ? 'text-[var(--color-warning)]' : 'text-muted'}`}
                />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate mb-0.5">
                  {folder.title}
                </span>
                <span className="text-[12px] text-muted font-mono">
                  {folder.bookmarkCount} bookmark
                  {folder.bookmarkCount !== 1 ? 's' : ''}
                  {folder.childCount > 0 &&
                    ` • ${folder.childCount} subfolder${folder.childCount !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="shrink-0">
                <LockToggle
                  folderId={folder.id}
                  currentLockState={lockStates[folder.id] || 'none'}
                  onChange={(newLock) => handleLockChange(folder.id, newLock)}
                />
              </div>
            </div>
          );
        })}

        {visibleFolders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-stone-400">
            <Folder className="w-10 h-10 opacity-40" />
            <p className="text-sm">No folders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
