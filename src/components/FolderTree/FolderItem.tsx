import * as React from 'react';
import { ChevronRight, Folder, FolderOpen, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkNode } from '@/types';
import { cn } from '@/lib/utils';
import { highlightText } from '@/utils/highlight';

export interface FolderItemProps {
  folder: BookmarkNode;
  depth: number;
  folderColor?: string;
  isExpanded: boolean;
  isSelected: boolean;
  isSubFolder?: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onContextMenu?: (folder: BookmarkNode, event: React.MouseEvent) => void;
  highlightQuery?: string;
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
  onToggle,
  onSelect,
  onContextMenu,
  highlightQuery = '',
}: FolderItemProps) {
  const bookmarkCount = countLeafBookmarks(folder);
  const hasChildren = folder.children && folder.children.length > 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: folder.id,
    data: {
      type: 'folder',
      parentId: folder.parentId,
      node: folder,
    },
  });

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

  const handleContextMenu = React.useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      onContextMenu?.(folder, event);
    },
    [folder, onContextMenu]
  );

  return (
    <div
      ref={setNodeRef}
      role="treeitem"
      aria-expanded={isExpanded}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleActivate}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      data-draggable-id={folder.id}
      className={cn(
        'group flex items-center gap-2.5 py-2.5 px-2 cursor-pointer transition-all duration-200',
        'pl-[calc(var(--spacing-4)*var(--depth))]',
        'hover:bg-(--folder-color)/10',
        (isSubFolder || isExpanded) && 'border-l-2 border-(--folder-color)',
        isExpanded && !isSubFolder && 'rounded-t-lg',
        !isExpanded && isSubFolder && 'rounded-tr-lg rounded-br-lg',
        !isExpanded && !isSubFolder && 'rounded-lg'
      )}
      style={style}
    >
      <span
        className={cn(
          'shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200',
          !hasChildren && 'invisible'
        )}
      >
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground', isExpanded && 'rotate-90')} />
      </span>

      <span
        className="cursor-grab active:cursor-grabbing"
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...attributes}
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
      </span>

      {isExpanded && hasChildren ? (
        <FolderOpen className="w-5 h-5 shrink-0" style={{ color: folderColor }} />
      ) : (
        <Folder className="w-5 h-5 shrink-0" style={{ color: folderColor }} />
      )}

      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {highlightQuery ? highlightText(folder.title, highlightQuery) : folder.title}
      </span>

      {bookmarkCount > 0 && (
        <span className="text-xs text-muted-foreground">({bookmarkCount})</span>
      )}
    </div>
  );
}
