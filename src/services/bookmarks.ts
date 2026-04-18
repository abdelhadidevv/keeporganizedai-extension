import { BookmarkNode } from '@/types';

export class BookmarkError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'BookmarkError';
    this.code = code;
  }
}

export function getBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((result) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'GET_TREE_FAILED'));
        return;
      }
      resolve(result);
    });
  });
}

export function getBookmarksByFolder(
  folderId: string
): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getChildren(folderId, (result) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'GET_CHILDREN_FAILED'));
        return;
      }
      resolve(result);
    });
  });
}

export function getAllBookmarks(): Promise<BookmarkNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((result) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'GET_TREE_FAILED'));
        return;
      }

      const bookmarks: BookmarkNode[] = [];

      function flatten(nodes: chrome.bookmarks.BookmarkTreeNode[]): void {
        nodes.forEach((node) => {
          if (node.url) {
            bookmarks.push({
              id: node.id,
              title: node.title,
              url: node.url,
              parentId: node.parentId,
              dateAdded: node.dateAdded,
              index: node.index,
            });
          }
          if (node.children) {
            flatten(node.children);
          }
        });
      }

      flatten(result);
      resolve(bookmarks);
    });
  });
}

export function createFolder(
  title: string,
  parentId?: string
): Promise<chrome.bookmarks.BookmarkTreeNode> {
  return new Promise((resolve, reject) => {
    const createOptions: chrome.bookmarks.CreateDetails = {
      title,
    };

    if (parentId) {
      createOptions.parentId = parentId;
    }

    chrome.bookmarks.create(createOptions, (result) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'CREATE_FAILED'));
        return;
      }
      resolve(result);
    });
  });
}

export function moveBookmark(
  bookmarkId: string,
  newParentId: string,
  index?: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const moveOptions: chrome.bookmarks.MoveDestination = {
      parentId: newParentId,
    };

    if (index !== undefined) {
      moveOptions.index = index;
    }

    chrome.bookmarks.move(bookmarkId, moveOptions, () => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'MOVE_FAILED'));
        return;
      }
      resolve();
    });
  });
}

export function deleteBookmark(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.remove(id, () => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'DELETE_FAILED'));
        return;
      }
      resolve();
    });
  });
}

export function deleteFolder(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.removeTree(id, () => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'DELETE_FAILED'));
        return;
      }
      resolve();
    });
  });
}

export function searchBookmarks(query: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search(query, (result) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        reject(new BookmarkError(lastError.message || 'Unknown error', 'SEARCH_FAILED'));
        return;
      }
      resolve(result);
    });
  });
}

export async function getFolderPath(folderId: string): Promise<string[]> {
  const path: string[] = [];

  async function traceUp(currentId: string): Promise<void> {
    const tree = await getBookmarkTree();

    function findNode(
      nodes: chrome.bookmarks.BookmarkTreeNode[],
      targetId: string
    ): chrome.bookmarks.BookmarkTreeNode | null {
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.id === targetId) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children, targetId);
          if (found) {
            return found;
          }
        }
      }
      return null;
    }

    const node = findNode(tree, currentId);
    if (node) {
      path.unshift(node.title);
      if (node.parentId) {
        await traceUp(node.parentId);
      }
    }
  }

  await traceUp(folderId);
  return path;
}

export const bookmarksService = {
  getBookmarkTree,
  getBookmarksByFolder,
  getAllBookmarks,
  createFolder,
  moveBookmark,
  deleteBookmark,
  deleteFolder,
  searchBookmarks,
  getFolderPath,
};
