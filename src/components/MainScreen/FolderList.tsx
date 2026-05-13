import { useState, useCallback, useRef } from 'react';
import { BookmarkNode } from '@/types';
import { FolderTree } from '@/components/FolderTree';
import { FolderContextMenu } from '@/components/FolderContextMenu';
import { EmptyState, createEmptyState } from '@/components/EmptyState';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Button,
} from '@/components/ui';
import { deleteBookmark, deleteFolder, moveBookmark } from '@/services/bookmarks';
import { backupService } from '@/services/backup';
import { toast } from 'sonner';
import { DndProvider } from '@/components/DndProvider';
import { TrashZone } from '@/components/TrashZone';
import { BookmarkBarZone } from '@/components/BookmarkBarZone';

interface FolderListProps {
  folders: BookmarkNode[];
  expandedFolderIds: Set<string>;
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;
  highlightQuery?: string;
  onToggleExpanded: (id: string) => void;
  onSelectFolder: (id: string | null) => void;
  onRefresh: () => void;
}

export function FolderList({
  folders,
  expandedFolderIds,
  selectedFolderId,
  isLoading,
  error,
  highlightQuery = '',
  onToggleExpanded,
  onSelectFolder,
  onRefresh,
}: FolderListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkNode | null>(null);
  const [trashTarget, setTrashTarget] = useState<{
    id: string;
    type: 'folder' | 'bookmark';
    title: string;
    parentId?: string;
  } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoDataRef = useRef<{
    id: string;
    title: string;
    url: string;
    parentId: string;
  } | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<{
    x: number;
    y: number;
    folder: BookmarkNode;
  } | null>(null);

  const handleBookmarkClick = useCallback((bookmark: BookmarkNode) => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank');
    }
  }, []);

  const handleBookmarkDelete = useCallback(
    (bookmarkId: string) => {
      const findBookmark = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findBookmark(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const bookmark = findBookmark(folders, bookmarkId);
      setSelectedBookmark(bookmark);
      setDeleteModalOpen(true);
    },
    [folders]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedBookmark) return;
    try {
      await deleteBookmark(selectedBookmark.id);
      toast.success('Bookmark deleted');
      setDeleteModalOpen(false);
      setSelectedBookmark(null);
      onRefresh();
    } catch {
      toast.error('Failed to delete bookmark');
    }
  }, [selectedBookmark, onRefresh]);

  const handleDragMove = useCallback(
    async (
      itemId: string,
      _sourceParentId: string | null,
      targetParentId: string,
      targetIndex: number
    ): Promise<boolean> => {
      try {
        await moveBookmark(itemId, targetParentId, targetIndex);
        return true;
      } catch (error) {
        toast.error(
          `Failed to move item: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return false;
      }
    },
    []
  );

  const handleTrash = useCallback(
    (itemId: string, type: 'folder' | 'bookmark') => {
      const findNode = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(folders, itemId);
      if (!node) return;

      if (type === 'folder') {
        setTrashTarget({
          id: node.id,
          type: 'folder',
          title: node.title,
          parentId: node.parentId,
        });
        return;
      }

      if (node.url) {
        undoDataRef.current = {
          id: node.id,
          title: node.title,
          url: node.url,
          parentId: node.parentId || '0',
        };
      }

      deleteBookmark(itemId)
        .then(() => {
          toast.success('Bookmark deleted', {
            action: {
              label: 'Undo',
              onClick: () => {
                if (undoTimeoutRef.current) {
                  clearTimeout(undoTimeoutRef.current);
                }
                if (!undoDataRef.current) return;

                const { title, url, parentId } = undoDataRef.current;
                chrome.bookmarks.create({ title, url, parentId }, () => {
                  if (chrome.runtime.lastError) {
                    toast.error('Failed to restore bookmark');
                    return;
                  }
                  toast.success('Bookmark restored');
                  undoDataRef.current = null;
                  onRefresh();
                });
              },
            },
            duration: 5000,
          });

          undoTimeoutRef.current = setTimeout(() => {
            undoDataRef.current = null;
          }, 6000);

          onRefresh();
        })
        .catch(() => {
          toast.error('Failed to delete bookmark');
        });
    },
    [folders, onRefresh]
  );

  const handleConfirmTrashDelete = useCallback(async () => {
    if (!trashTarget) return;
    try {
      if (trashTarget.type === 'folder') {
        await deleteFolder(trashTarget.id);
        toast.success(`Folder "${trashTarget.title}" deleted`);
      }
      setTrashTarget(null);
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  }, [trashTarget, onRefresh]);

  const handleFolderContextMenu = useCallback((folder: BookmarkNode, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenuTarget({ x: event.clientX, y: event.clientY, folder });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenuTarget(null);
  }, []);

  const handleShareFolder = useCallback(async () => {
    if (!contextMenuTarget) return;
    const { folder } = contextMenuTarget;
    try {
      await backupService.exportFolderAsHtml(folder.id, folder.title);
      toast.success(`"${folder.title}" exported as HTML`);
    } catch {
      toast.error('Failed to export folder');
    }
    setContextMenuTarget(null);
  }, [contextMenuTarget]);

  const handlePinToBar = useCallback(
    (itemId: string, _type: 'folder' | 'bookmark') => {
      const findNode = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(folders, itemId);
      if (!node) return;

      moveBookmark(itemId, '1')
        .then(() => {
          onRefresh();
        })
        .catch(() => {
          toast.error('Failed to pin to Bookmarks Bar');
        });
    },
    [folders, onRefresh]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <EmptyState
          icon={
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          }
          title="Loading bookmarks..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <EmptyState
          title="Error loading bookmarks"
          description={error}
          action={{
            label: 'Try again',
            onClick: onRefresh,
          }}
        />
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <EmptyState {...createEmptyState('noBookmarks')} />
      </div>
    );
  }

  const bookmarkTitle = selectedBookmark?.title || 'this bookmark';
  const trashTitle = trashTarget?.title || 'this item';

  return (
    <div className="flex-1 overflow-y-auto h-screen px-3 py-3 select-none">
      <DndProvider
        onMove={handleDragMove}
        onRefresh={onRefresh}
        onTrash={handleTrash}
        onPinToBar={handlePinToBar}
      >
        <div className="flex flex-col min-h-full">
          <BookmarkBarZone />
          <div className="flex-1">
            <FolderTree
              folders={folders}
              selectedId={selectedFolderId}
              expandedIds={expandedFolderIds}
              onToggle={onToggleExpanded}
              onSelect={onSelectFolder}
              onFolderContextMenu={handleFolderContextMenu}
              onBookmarkClick={handleBookmarkClick}
              onBookmarkDelete={handleBookmarkDelete}
              highlightQuery={highlightQuery}
            />
          </div>
          <TrashZone />
        </div>
      </DndProvider>

      {contextMenuTarget && (
        <FolderContextMenu
          x={contextMenuTarget.x}
          y={contextMenuTarget.y}
          folderName={contextMenuTarget.folder.title}
          onShare={handleShareFolder}
          onClose={handleContextMenuClose}
        />
      )}

      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent className="max-w-[420px]">
          <ModalHeader className="pb-2">
            <ModalTitle>Delete Bookmark</ModalTitle>
            <ModalDescription>
              {`Are you sure you want to delete "${bookmarkTitle}"? This action cannot be undone.`}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        open={trashTarget !== null}
        onOpenChange={(open) => {
          if (!open) setTrashTarget(null);
        }}
      >
        <ModalContent className="max-w-[420px]">
          <ModalHeader className="pb-2">
            <ModalTitle>Delete Folder</ModalTitle>
            <ModalDescription>
              {`Are you sure you want to delete "${trashTitle}" and all its contents? This action cannot be undone.`}
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setTrashTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmTrashDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
