import { useState, useCallback } from 'react';
import { Bookmark, ExternalLink, Trash2, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { BookmarkNode } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { highlightText } from '@/utils/highlight';

export interface BookmarkItemProps {
  bookmark: BookmarkNode;
  onDelete?: (id: string) => void;
  onClick?: (bookmark: BookmarkNode) => void;
  isSelected?: boolean;
  highlightQuery?: string;
  folderColor?: string;
  isLastBookmark?: boolean;
  isDragging?: boolean;
  hideBorder?: boolean;
}

export function BookmarkItem({
  bookmark,
  onDelete,
  onClick,
  highlightQuery = '',
  folderColor,
  isLastBookmark,
  isDragging = false,
  hideBorder,
}: BookmarkItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bookmark.id,
    data: {
      type: 'bookmark',
      parentId: bookmark.parentId,
      node: bookmark,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const getFavicon = useCallback(() => {
    if (!bookmark.url) {
      return null;
    }

    if (faviconUrl) {
      return faviconUrl;
    }

    try {
      const url = new URL(bookmark.url);
      const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
      setFaviconUrl(favicon);
      return favicon;
    } catch {
      return null;
    }
  }, [bookmark.url, faviconUrl]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(bookmark.id);
  };

  const handleClick = () => {
    onClick?.(bookmark);
  };

  const handleMouseEnter = () => {
    setShowActions(true);
  };

  const handleMouseLeave = () => {
    setShowActions(false);
  };

  const favicon = getFavicon();

  return (
    <div
      ref={setNodeRef}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...attributes}
      /* eslint-disable-next-line react/jsx-props-no-spreading */
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-draggable-id={bookmark.id}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all duration-200',
        'hover:bg-[var(--folder-color)]/10',
        !hideBorder && 'border-l-2 border-[var(--folder-color)]',
        isLastBookmark && 'rounded-b-lg'
      )}
      style={
        {
          '--folder-color': folderColor,
          transform: style.transform,
          opacity: style.opacity,
        } as React.CSSProperties
      }
    >
      <GripVertical className="w-3.5 h-3.5 flex-shrink-0 text-muted/40 cursor-grab active:cursor-grabbing" />

      <div className="flex-shrink-0 w-5 h-5">
        {favicon ? (
          <img
            src={favicon}
            alt=""
            className="w-full h-full rounded-sm"
            onError={() => setFaviconUrl(null)}
          />
        ) : (
          <Bookmark className="w-5 h-5 text-muted" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted truncate" title={bookmark.title}>
          {highlightQuery
            ? highlightText(bookmark.title || 'Untitled', highlightQuery)
            : bookmark.title || 'Untitled'}
        </p>
        <p
          className={cn(
            'text-xs text-muted/60 truncate transition-opacity duration-200',
            showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          title={bookmark.url}
        >
          {highlightQuery && bookmark.url
            ? highlightText(bookmark.url, highlightQuery)
            : bookmark.url}
        </p>
      </div>

      <div
        className={cn(
          'flex items-center gap-1 transition-opacity duration-200',
          showActions ? 'opacity-100' : 'opacity-0'
        )}
      >
        {onClick && bookmark.url && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(bookmark.url, '_blank');
            }}
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            title="Delete bookmark"
            className="hover:text-[var(--color-error)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
