import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BookmarkNode } from '@/types/index';
import { BookmarkItem } from '@/components/BookmarkItem';
import { cn } from '@/lib/utils';
import { getFolderColor } from '@/utils/folder-colors';
import { FolderItem } from './FolderItem';

export interface FolderTreeProps {
  folders: BookmarkNode[];
  selectedId?: string | null;
  expandedIds?: Set<string>;
  defaultExpandedIds?: string[];
  onToggle?: (id: string) => void;
  onSelect?: (id: string) => void;
  onFolderClick?: (id: string) => void;
  onFolderContextMenu?: (folder: BookmarkNode, event: React.MouseEvent) => void;
  onBookmarkClick?: (bookmark: BookmarkNode) => void;
  onBookmarkDelete?: (bookmarkId: string) => void;
  maxDepth?: number;
  className?: string;
  highlightQuery?: string;
}

interface RenderFolderProps {
  folder: BookmarkNode;
  depth: number;
  index: number;
  expandedIds: Set<string>;
  selectedId?: string | null;
  onToggle: (id: string) => void;
  onToggleOriginal?: (id: string) => void;
  onSelect?: (id: string) => void;
  onFolderClick?: (id: string) => void;
  onFolderContextMenu?: (folder: BookmarkNode, event: React.MouseEvent) => void;
  onBookmarkClick?: (bookmark: BookmarkNode) => void;
  onBookmarkDelete?: (bookmarkId: string) => void;
  maxDepth?: number;
  highlightQuery?: string;
  isSubFolder?: boolean;
}

function RenderFolder({
  folder,
  depth,
  index,
  expandedIds,
  selectedId,
  onToggle,
  onToggleOriginal,
  onSelect,
  onFolderClick,
  onFolderContextMenu,
  onBookmarkClick,
  onBookmarkDelete,
  maxDepth,
  highlightQuery = '',
  isSubFolder,
}: RenderFolderProps) {
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedId === folder.id;
  const children = folder.children ?? [];
  const subFolders = children.filter((child) => !child.url);
  const bookmarks = children.filter((child) => child.url);
  const hasChildren = children.length > 0;
  const folderColor = getFolderColor(index);

  const handleToggle = useCallback(
    (id: string) => {
      onToggle(id);
    },
    [onToggle]
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSelect?.(id);
      if (onFolderClick && onFolderClick !== onToggleOriginal) {
        onFolderClick(id);
      }
    },
    [onSelect, onFolderClick, onToggleOriginal]
  );

  let nextIndex = index + 1;

  return (
    <div role="group">
      <FolderItem
        folder={folder}
        depth={depth}
        folderColor={folderColor}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isSubFolder={isSubFolder}
        onToggle={hasChildren ? handleToggle : () => {}}
        onSelect={handleSelect}
        onContextMenu={onFolderContextMenu}
        highlightQuery={highlightQuery}
      />

      {isExpanded && (
        <div className="w-full rounded-b-lg">
          {bookmarks.length > 0 && (
            <SortableContext
              items={bookmarks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {bookmarks.map((bookmark, index) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onClick={onBookmarkClick}
                  onDelete={onBookmarkDelete}
                  highlightQuery={highlightQuery}
                  folderColor={folderColor}
                  isLastBookmark={index === bookmarks.length - 1 && subFolders.length === 0}
                />
              ))}
            </SortableContext>
          )}
          {subFolders.length > 0 && (
            <SortableContext
              items={subFolders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {subFolders.map((child) => {
                if (maxDepth !== undefined && depth >= maxDepth) return null;
                const currentIndex = nextIndex;
                nextIndex += countFolders(child);
                return (
                  <RenderFolder
                    key={child.id}
                    folder={child}
                    depth={depth + 1}
                    index={currentIndex}
                    expandedIds={expandedIds}
                    selectedId={selectedId}
                    onToggle={onToggle}
                    onToggleOriginal={onToggleOriginal}
                    onSelect={onSelect}
                    onFolderClick={onFolderClick}
                    onFolderContextMenu={onFolderContextMenu}
                    onBookmarkClick={onBookmarkClick}
                    onBookmarkDelete={onBookmarkDelete}
                    maxDepth={maxDepth}
                    highlightQuery={highlightQuery}
                    isSubFolder
                  />
                );
              })}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

function countFolders(node: BookmarkNode): number {
  if (!node.children) return 1;
  let count = 1;
  for (const child of node.children) {
    if (!child.url) {
      count += countFolders(child);
    }
  }
  return count;
}

export function FolderTree({
  folders,
  selectedId,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onToggle,
  onSelect,
  onFolderClick,
  onFolderContextMenu,
  onBookmarkClick,
  onBookmarkDelete,
  maxDepth,
  className,
  highlightQuery = '',
}: FolderTreeProps) {
  const { t } = useTranslation('common');
  const isControlled = controlledExpandedIds !== undefined;
  const initialExpanded = new Set(defaultExpandedIds ?? []);
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(initialExpanded);

  const expandedIds = isControlled ? controlledExpandedIds : internalExpandedIds;

  const handleToggle = useCallback(
    (id: string) => {
      if (isControlled && onToggle) {
        onToggle(id);
      } else {
        setInternalExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      }
    },
    [isControlled, onToggle]
  );

  if (folders.length === 0) {
    return (
      <div className={cn('p-4 text-sm text-muted-foreground', className)}>
        {t('folder_tree.no_folders')}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col p-1 gap-1.5', className)} role="tree">
      {folders.filter((f) => f.url).length > 0 && (
        <SortableContext
          items={folders.filter((f) => f.url).map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {folders
            .filter((f) => f.url)
            .map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onClick={onBookmarkClick}
                onDelete={onBookmarkDelete}
                highlightQuery={highlightQuery}
                hideBorder
              />
            ))}
        </SortableContext>
      )}
      {folders.filter((f) => !f.url).length > 0 && (
        <SortableContext
          items={folders.filter((f) => !f.url).map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {folders
            .filter((f) => !f.url)
            .map((folder, i) => (
              <RenderFolder
                key={folder.id}
                folder={folder}
                depth={0}
                index={i}
                expandedIds={expandedIds}
                selectedId={selectedId}
                onToggle={handleToggle}
                onToggleOriginal={onToggle}
                onSelect={onSelect}
                onFolderClick={onFolderClick}
                onFolderContextMenu={onFolderContextMenu}
                onBookmarkClick={onBookmarkClick}
                onBookmarkDelete={onBookmarkDelete}
                maxDepth={maxDepth}
                highlightQuery={highlightQuery}
              />
            ))}
        </SortableContext>
      )}
    </div>
  );
}
