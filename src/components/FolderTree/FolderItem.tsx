/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChevronRight, Folder, FolderOpen, GripVertical } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkNode, LockType } from '@/types';
import { cn } from '@/lib/utils';
import { highlightText } from '@/utils/highlight';

export interface FolderItemProps {
  folder: BookmarkNode;
  depth: number;
  folderColor?: string;
  isExpanded: boolean;
  isSelected: boolean;
  isSubFolder?: boolean;
  isLocked: boolean;
  lockType?: LockType;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  highlightQuery?: string;
  isDropTarget?: boolean;
}

function countLeafBookmarks(node: BookmarkNode): number {
  if (!node.children || node.children.length === 0) {
    return node.url ? 1 : 0;
  }
  return node.children.reduce((sum, child) => sum + countLeafBookmarks(child), 0);
}

export function FolderItem({
  folder,
  depth,
  folderColor,
  isExpanded,
  isSelected,
  isSubFolder,
  isLocked,
  // lockType,
  onToggle,
  onSelect,
  highlightQuery = '',
  isDropTarget = false,
}: FolderItemProps) {
  const bookmarkCount = countLeafBookmarks(folder);
  const hasChildren = folder.children && folder.children.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      parentId: folder.parentId,
      node: folder,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: folder.id,
    data: {
      type: 'folder',
      parentId: folder.parentId,
    },
  });

  const setRef = (el: HTMLDivElement | null) => {
    setSortableRef(el);
    setDroppableRef(el);
  };

  const style: React.CSSProperties = {
    '--depth': depth,
    '--folder-color': folderColor,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  } as React.CSSProperties;

  const handleActivate = () => {
    if (hasChildren) {
      onToggle(folder.id);
    }
    onSelect(folder.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      ref={setRef}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...attributes}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...listeners}
      role="treeitem"
      aria-expanded={isExpanded}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      data-draggable-id={folder.id}
      className={cn(
        'group flex items-center gap-2.5 py-2.5 px-2 cursor-pointer transition-all duration-200',
        'pl-[calc(var(--spacing-4)*var(--depth))]',
        'hover:bg-[var(--folder-color)]/10',
        (isSubFolder || isExpanded) && 'border-l-2 border-[var(--folder-color)]',
        isExpanded && !isSubFolder && 'rounded-t-lg',
        !isExpanded && isSubFolder && 'rounded-tr-lg rounded-br-lg',
        !isExpanded && !isSubFolder && 'rounded-lg',
        (isOver || isDropTarget) &&
          !isLocked &&
          'bg-[var(--folder-color)]/20 border-l-4 border-l-[var(--color-primary)]'
      )}
      style={style}
    >
      <span
        className={cn(
          'flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200',
          !hasChildren && 'invisible'
        )}
      >
        <ChevronRight
          className={cn('w-4 h-4 text-[var(--color-secondary)]', isExpanded && 'rotate-90')}
        />
      </span>

      <GripVertical className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-secondary)]/40 cursor-grab active:cursor-grabbing" />

      {isExpanded && hasChildren ? (
        <FolderOpen className="w-5 h-5 flex-shrink-0" style={{ color: folderColor }} />
      ) : (
        <Folder className="w-5 h-5 flex-shrink-0" style={{ color: folderColor }} />
      )}

      <span className="flex-1 truncate text-sm font-medium text-[var(--color-secondary)]">
        {highlightQuery ? highlightText(folder.title, highlightQuery) : folder.title}
      </span>

      {bookmarkCount > 0 && (
        <span className="text-xs text-[var(--color-secondary)]/60">({bookmarkCount})</span>
      )}
    </div>
  );
}
