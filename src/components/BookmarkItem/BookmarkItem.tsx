import { useState, useCallback } from 'react';
import { Bookmark, Copy, Check, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  hideBorder?: boolean;
}

export function BookmarkItem({
  bookmark,
  onDelete,
  onClick,
  highlightQuery = '',
  folderColor,
  isLastBookmark,
  hideBorder,
}: BookmarkItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
    data: {
      type: 'bookmark',
      parentId: bookmark.parentId,
      node: bookmark,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
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

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bookmark.url) return;

    try {
      await navigator.clipboard.writeText(bookmark.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      console.error('[BookmarkItem] Failed to copy URL');
    }
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
        'hover:bg-(--folder-color)/10',
        !hideBorder && 'border-l-2 border-(--folder-color)',
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
      <span
        className="cursor-grab active:cursor-grabbing"
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...attributes}
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
      </span>

      <div className="shrink-0 w-5 h-5">
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
        <p className="text-sm font-medium text-foreground truncate" title={bookmark.title}>
          {highlightQuery
            ? highlightText(bookmark.title || 'Untitled', highlightQuery)
            : bookmark.title || 'Untitled'}
        </p>
        <p
          className={cn(
            'text-xs text-muted-foreground truncate transition-opacity duration-200',
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
            onClick={handleCopyUrl}
            title={isCopied ? 'Copied!' : 'Copy URL'}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
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
