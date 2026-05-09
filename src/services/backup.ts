import { BackupData, BookmarkNode } from '@/types';
import { get, set, remove } from './storage';

const BACKUP_PREFIX = 'backup_';
const BACKUP_INDEX_KEY = 'backupIndex';
const MAX_BACKUPS = 10;
const BACKUP_VERSION = '1.0';

export type { BackupData } from '@/types';
export interface BackupMetadata {
  id: string;
  createdAt: string;
  bookmarkCount: number;
  folderCount: number;
  version: string;
}

async function getBackupMetadata(): Promise<BackupMetadata[]> {
  const index = await get<BackupMetadata[]>(BACKUP_INDEX_KEY);
  if (!index) return [];
  return index
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function updateBackupIndex(metadata: BackupMetadata[]): Promise<void> {
  await set(BACKUP_INDEX_KEY, metadata);
}

async function getAllBookmarks(): Promise<BookmarkNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}

async function createBackup(): Promise<BackupMetadata> {
  const tree = await getAllBookmarks();

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    bookmarkTree: tree,
  };

  const timestamp = Date.now();
  const backupId = `${BACKUP_PREFIX}${timestamp}`;

  await set(backupId, backupData);

  let bookmarkCount = 0;
  let folderCount = 0;

  function countNodes(nodes: BookmarkNode[]): void {
    nodes.forEach((node) => {
      if (node.url) {
        bookmarkCount += 1;
      } else {
        folderCount += 1;
      }
      if (node.children) {
        countNodes(node.children);
      }
    });
  }

  countNodes(tree);

  const metadata: BackupMetadata = {
    id: backupId,
    createdAt: backupData.createdAt,
    bookmarkCount,
    folderCount,
    version: BACKUP_VERSION,
  };

  const index = await getBackupMetadata();
  index.push(metadata);
  await updateBackupIndex(index);

  return metadata;
}

async function storeBackup(data: BackupData): Promise<string> {
  const id = Date.now().toString();
  const backupId = `${BACKUP_PREFIX}${id}`;

  let bookmarkCount = 0;
  let folderCount = 0;

  function countNodes(nodes: BookmarkNode[]): void {
    nodes.forEach((node) => {
      if (node.url) {
        bookmarkCount += 1;
      } else {
        folderCount += 1;
      }
      if (node.children) {
        countNodes(node.children);
      }
    });
  }

  countNodes(data.bookmarkTree);

  const metadata: BackupMetadata = {
    id: backupId,
    createdAt: data.createdAt,
    bookmarkCount,
    folderCount,
    version: data.version,
  };

  await set(backupId, data);

  const index = await getBackupMetadata();
  index.push(metadata);

  if (index.length > MAX_BACKUPS) {
    const sorted = index
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const toDelete = sorted.slice(MAX_BACKUPS);
    const deletePromises = toDelete.map((backup) => remove(backup.id));
    await Promise.all(deletePromises);
    await updateBackupIndex(sorted.slice(0, MAX_BACKUPS));
  } else {
    await updateBackupIndex(index);
  }

  return backupId;
}

async function getBackup(backupId: string): Promise<BackupData | null> {
  const backup = await get<BackupData>(backupId);
  return backup || null;
}

async function getLatestBackup(): Promise<BackupData | null> {
  const index = await getBackupMetadata();
  if (index.length === 0) return null;

  const sorted = index
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return getBackup(sorted[0].id);
}

async function deleteAllBookmarksExceptRoot(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const nodesToDelete: string[] = [];

      function collectNodes(nodes: BookmarkNode[]): void {
        nodes.forEach((node) => {
          if (node.id !== '0' && node.id !== '1' && node.id !== '2') {
            nodesToDelete.push(node.id);
          }
          if (node.children) {
            collectNodes(node.children);
          }
        });
      }

      collectNodes(tree);

      const deletePromises = nodesToDelete.map(
        (id) =>
          new Promise<void>((res) => {
            chrome.bookmarks.removeTree(id, () => {
              if (chrome.runtime.lastError) {
                console.warn(`Failed to delete bookmark ${id}:`, chrome.runtime.lastError.message);
              }
              res();
            });
          })
      );

      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(reject);
    });
  });
}

async function createBookmark(title: string, parentId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ title, parentId }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result.id);
    });
  });
}

async function restoreFromBackup(backupId: string): Promise<void> {
  const backup = await getBackup(backupId);
  if (!backup) {
    throw new Error(`Backup ${backupId} not found`);
  }

  await deleteAllBookmarksExceptRoot();

  async function createNode(
    node: BookmarkNode,
    parentId?: string
  ): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
    if (node.id === '0' || node.id === '1' || node.id === '2') {
      if (node.children && node.children.length > 0) {
        const promises = node.children.map((child) => createNode(child, node.id));
        await Promise.all(promises);
      }
      return null;
    }

    const options: chrome.bookmarks.CreateDetails = {
      title: node.title,
      parentId: parentId || '0',
    };

    if (node.url) {
      options.url = node.url;
    }

    const newNode = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve, reject) => {
      chrome.bookmarks.create(options, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result);
      });
    });

    if (node.children && node.children.length > 0) {
      const promises = node.children.map((child) => createNode(child, newNode.id));
      await Promise.all(promises);
    }

    return newNode;
  }

  for (const rootNode of backup.bookmarkTree) {
    await createNode(rootNode, rootNode.id === '0' ? undefined : rootNode.parentId);
  }
}

async function deleteBackup(backupId: string): Promise<void> {
  await remove(backupId);

  const index = await getBackupMetadata();
  const filtered = index.filter((m) => m.id !== backupId);
  await updateBackupIndex(filtered);
}

async function deleteOldBackups(keepCount: number): Promise<void> {
  const index = await getBackupMetadata();
  const sorted = index
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const toDelete = sorted.slice(keepCount);

  const deletePromises = toDelete.map((backup) => remove(backup.id));
  await Promise.all(deletePromises);

  await updateBackupIndex(sorted.slice(0, keepCount));
}

async function createChromeBackupFolder(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const folderName = '_KeepOrganizedAI Backup';

      function findExistingFolder(nodes: BookmarkNode[]): string | null {
        return nodes.reduce<string | null>((found, node) => {
          if (found) return found;
          if (node.title === folderName && !node.url) {
            return node.id;
          }
          if (node.children) {
            return findExistingFolder(node.children);
          }
          return null;
        }, null);
      }

      const existingId = findExistingFolder(tree);
      if (existingId) {
        resolve(existingId);
        return;
      }

      createBookmark(folderName, '0').then(resolve).catch(reject);
    });
  });
}

async function restoreToChromeFolder(backup: BackupData): Promise<string> {
  const backupFolderId = await createChromeBackupFolder();

  async function restoreNodes(nodes: BookmarkNode[], parentId: string): Promise<void> {
    const promises = nodes.map(async (node) => {
      const options: chrome.bookmarks.CreateDetails = {
        title: node.title,
        parentId,
      };

      if (node.url) {
        options.url = node.url;
        return new Promise<void>((resolve) => {
          chrome.bookmarks.create(options, () => resolve());
        });
      }

      const newNode = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve) => {
        chrome.bookmarks.create(options, (result) => resolve(result));
      });

      if (node.children && node.children.length > 0) {
        await restoreNodes(node.children, newNode.id);
      }
    });

    await Promise.all(promises);
  }

  for (const rootNode of backup.bookmarkTree) {
    await restoreNodes([rootNode], backupFolderId);
  }

  return backupFolderId;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function nodeToHtml(node: BookmarkNode, indent: string = '    '): string {
  const parts: string[] = [];

  if (node.url) {
    const title = node.title || 'Untitled';
    parts.push(`${indent}<DT><A HREF="${escapeHtml(node.url)}">${escapeHtml(title)}</A>\n`);
  } else {
    const title = node.title || 'Untitled Folder';
    parts.push(`${indent}<DT><H3>${escapeHtml(title)}</H3>\n`);
    if (node.children && node.children.length > 0) {
      parts.push(`${indent}<DL><p>\n`);
      node.children.forEach((child) => {
        parts.push(nodeToHtml(child, `${indent}    `));
      });
      parts.push(`${indent}</DL><p>\n`);
    }
  }

  return parts.join('');
}

function generateChromeHtmlBackup(backupData: BackupData): string {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. It will be read and overwritten. DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  backupData.bookmarkTree.forEach((rootNode) => {
    html += nodeToHtml(rootNode, '    ');
  });

  html += '</DL><p>\n';

  return html;
}

async function exportAsDownload(): Promise<void> {
  const tree = await getAllBookmarks();

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    bookmarkTree: tree,
  };

  const htmlContent = generateChromeHtmlBackup(backupData);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear() % 100;
  const filename = `bookmarks_${month}_${day}_${year}.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function exportToJson(): Promise<void> {
  const tree = await getAllBookmarks();

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    bookmarkTree: tree,
  };

  const jsonContent = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear() % 100;
  const filename = `bookmarks_${month}_${day}_${year}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseHtmlContent(html: string): BackupData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let bookmarkCount = 0;
  let folderCount = 0;

  function parseDl(dl: Element | null): BookmarkNode[] {
    if (!dl) return [];

    const children: BookmarkNode[] = [];
    const dtElements = dl.children;

    for (let i = 0; i < dtElements.length; i += 1) {
      const dt = dtElements[i];
      const h3 = dt.querySelector(':scope > H3');
      const a = dt.querySelector(':scope > A');
      const nestedDl = dt.querySelector(':scope > DL');

      if (h3) {
        folderCount += 1;
        const folder: BookmarkNode = {
          id: `imported_folder_${Date.now()}_${folderCount}`,
          title: h3.textContent || 'Untitled Folder',
          children: parseDl(nestedDl),
        };
        children.push(folder);
      } else if (a) {
        bookmarkCount += 1;
        const bookmark: BookmarkNode = {
          id: `imported_bookmark_${Date.now()}_${bookmarkCount}`,
          title: a.textContent || 'Untitled',
          url: a.getAttribute('HREF') || '',
        };
        children.push(bookmark);
      }
    }

    return children;
  }

  const dl = doc.querySelector('DL');
  const bookmarkTree = parseDl(dl);

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    bookmarkTree,
  };
}

function parseJsonContent(json: string): BackupData {
  const data = JSON.parse(json);

  if (!data.bookmarkTree || !Array.isArray(data.bookmarkTree)) {
    throw new Error('Invalid JSON format: missing bookmarkTree array');
  }

  return {
    version: data.version || BACKUP_VERSION,
    createdAt: data.createdAt || new Date().toISOString(),
    bookmarkTree: data.bookmarkTree,
  };
}

async function parseHtmlImport(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const data = parseHtmlContent(content);
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse HTML bookmark file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parseJsonImport(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const data = parseJsonContent(content);
        resolve(data);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse JSON bookmark file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parseFileImport(file: File): Promise<BackupData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'html' || extension === 'htm') {
    return parseHtmlImport(file);
  }
  if (extension === 'json') {
    return parseJsonImport(file);
  }

  throw new Error('Unsupported file format. Use .html or .json files.');
}

function countNodes(nodes: BookmarkNode[]): { bookmarks: number; folders: number } {
  let bookmarks = 0;
  let folders = 0;

  function traverse(nodeList: BookmarkNode[]): void {
    nodeList.forEach((node) => {
      if (node.url) {
        bookmarks += 1;
      } else {
        folders += 1;
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  }

  traverse(nodes);
  return { bookmarks, folders };
}

async function importBookmarks(data: BackupData, mode: 'merge' | 'replace'): Promise<void> {
  if (mode === 'replace') {
    await deleteAllBookmarksExceptRoot();
  }

  const importFolderTitle = 'Imported Bookmarks';

  const importFolderId = await new Promise<string>((resolve, reject) => {
    chrome.bookmarks.getChildren('2', (children) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const existing = children.find((child) => !child.url && child.title === importFolderTitle);

      if (existing) {
        resolve(existing.id);
      } else {
        chrome.bookmarks.create({ title: importFolderTitle, parentId: '2' }, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result.id);
        });
      }
    });
  });

  async function importNodes(nodes: BookmarkNode[], parentId: string): Promise<void> {
    const promises = nodes.map(async (node) => {
      if (node.url) {
        await new Promise<void>((resolve, reject) => {
          chrome.bookmarks.create(
            {
              title: node.title,
              url: node.url,
              parentId,
            },
            () => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve();
            }
          );
        });
      } else {
        const newFolderId = await new Promise<string>((resolve, reject) => {
          chrome.bookmarks.create(
            {
              title: node.title,
              parentId,
            },
            (result) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }
              resolve(result.id);
            }
          );
        });

        if (node.children && node.children.length > 0) {
          await importNodes(node.children, newFolderId);
        }
      }
    });

    await Promise.all(promises);
  }

  await importNodes(data.bookmarkTree, importFolderId);
}

export const backupService = {
  getBackupMetadata,
  createBackup,
  storeBackup,
  getBackup,
  getLatestBackup,
  restoreFromBackup,
  deleteBackup,
  deleteOldBackups,
  createChromeBackupFolder,
  restoreToChromeFolder,
  exportAsDownload,
  exportToJson,
  parseHtmlImport,
  parseJsonImport,
  parseFileImport,
  importBookmarks,
  countNodes,
};
