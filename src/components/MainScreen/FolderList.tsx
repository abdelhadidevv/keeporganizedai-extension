import { useState, useCallback } from 'react';
import { BookmarkNode, LockType } from '@/types';
import { FolderTree } from '@/components/FolderTree';
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
import { deleteBookmark, moveBookmark } from '@/services/bookmarks';
import { toast } from 'sonner';
import { DndProvider } from '@/components/DndProvider';

interface FolderListProps {
  folders: BookmarkNode[];
  expandedFolderIds: Set<string>;
  selectedFolderId: string | null;
  lockStates: Record<string, LockType>;
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
  lockStates,
  isLoading,
  error,
  highlightQuery = '',
  onToggleExpanded,
  onSelectFolder,
  onRefresh,
}: FolderListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkNode | null>(null);

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

  return (
    <div className="flex-1 overflow-y-auto h-screen px-3 py-3 select-none">
      <DndProvider onMove={handleDragMove} onRefresh={onRefresh} lockStates={lockStates}>
        <FolderTree
          folders={folders}
          selectedId={selectedFolderId}
          expandedIds={expandedFolderIds}
          lockStates={lockStates}
          onToggle={onToggleExpanded}
          onSelect={onSelectFolder}
          onBookmarkClick={handleBookmarkClick}
          onBookmarkDelete={handleBookmarkDelete}
          highlightQuery={highlightQuery}
        />
      </DndProvider>

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
    </div>
  );
}
