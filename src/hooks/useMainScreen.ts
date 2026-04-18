import { useState, useCallback, useEffect, useMemo } from 'react';
import { BookmarkNode, LockType } from '@/types';
import { getBookmarkTree } from '@/services/bookmarks';
import { lockStateService } from '@/services/lockState';

interface UseMainScreenReturn {
  folders: BookmarkNode[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredFolders: BookmarkNode[];
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  expandedFolderIds: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  lockStates: Record<string, LockType>;
  refreshBookmarks: () => Promise<void>;
  totalBookmarkCount: number;
  hasBookmarks: boolean;
}

function getAllFolderIds(node: BookmarkNode): string[] {
  const ids: string[] = [];
  if (!node.url && node.children) {
    ids.push(node.id);
    node.children.forEach((child) => {
      ids.push(...getAllFolderIds(child));
    });
  }
  return ids;
}

function flattenTree(nodes: chrome.bookmarks.BookmarkTreeNode[]): BookmarkNode[] {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title || 'Untitled',
    url: node.url,
    parentId: node.parentId,
    dateAdded: node.dateAdded,
    index: node.index,
    children: node.children ? flattenTree(node.children) : undefined,
  }));
}

function extractUserFolders(bookmarkTree: BookmarkNode[]): BookmarkNode[] {
  if (bookmarkTree.length === 0) return [];
  const rootFolder = bookmarkTree[0];
  if (!rootFolder.children || rootFolder.children.length === 0) return [];
  return rootFolder.children.flatMap((child) => child.children || []);
}

function filterFolders(folders: BookmarkNode[], query: string): BookmarkNode[] {
  if (!query.trim()) {
    return folders;
  }

  const lowerQuery = query.toLowerCase();

  function findMatchingParents(node: BookmarkNode): boolean {
    if (!node.url && node.children) {
      const hasMatchingChild = node.children.some((child) => {
        if (child.url) {
          return (
            child.title.toLowerCase().includes(lowerQuery) ||
            (child.url && child.url.toLowerCase().includes(lowerQuery))
          );
        }
        return findMatchingParents(child);
      });

      if (hasMatchingChild) {
        return true;
      }
    }

    if (node.url) {
      const titleMatch = node.title.toLowerCase().includes(lowerQuery);
      const urlMatch = node.url ? node.url.toLowerCase().includes(lowerQuery) : false;
      return titleMatch || urlMatch;
    }

    return node.title.toLowerCase().includes(lowerQuery);
  }

  function filterNode(node: BookmarkNode): BookmarkNode | null {
    const isMatch = findMatchingParents(node);

    if (node.url) {
      return isMatch ? node : null;
    }

    const filteredChildren = node.children
      ?.map(filterNode)
      .filter((child): child is BookmarkNode => child !== null);

    if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
      return {
        ...node,
        children: filteredChildren || [],
      };
    }

    return null;
  }

  const results: BookmarkNode[] = [];
  folders.forEach((folder) => {
    const filtered = filterNode(folder);
    if (filtered) {
      results.push(filtered);
    }
  });

  return results;
}

function countLeafBookmarks(node: BookmarkNode): number {
  if (!node.children || node.children.length === 0) {
    return node.url ? 1 : 0;
  }
  return node.children.reduce((sum, child) => sum + countLeafBookmarks(child), 0);
}

export function useMainScreen(): UseMainScreenReturn {
  const [folders, setFolders] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());
  const [lockStates, setLockStates] = useState<Record<string, LockType>>({});

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tree = await getBookmarkTree();
      const bookmarkTree = flattenTree(tree);
      const userFolders = extractUserFolders(bookmarkTree);
      setFolders(userFolders);

      const lockStatesData = await lockStateService.getLockStates();
      const lockMap: Record<string, LockType> = {};
      lockStatesData.forEach((state) => {
        lockMap[state.folderId] = state.lockType;
      });
      setLockStates(lockMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const toggleExpanded = useCallback((id: string) => {
    console.log('toggleExpanded:', id);
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds: string[] = [];
    folders.forEach((folder) => {
      allIds.push(...getAllFolderIds(folder));
    });
    setExpandedFolderIds(new Set(allIds));
  }, [folders]);

  const collapseAll = useCallback(() => {
    setExpandedFolderIds(new Set());
  }, []);

  const filteredFolders = useMemo(
    () => filterFolders(folders, searchQuery),
    [folders, searchQuery]
  );

  const totalBookmarkCount = useMemo(
    () => folders.reduce((sum, folder) => sum + countLeafBookmarks(folder), 0),
    [folders]
  );

  const hasBookmarks = totalBookmarkCount > 0;

  return {
    folders,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filteredFolders,
    selectedFolderId,
    setSelectedFolderId,
    expandedFolderIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    lockStates,
    refreshBookmarks: loadBookmarks,
    totalBookmarkCount,
    hasBookmarks,
  };
}
