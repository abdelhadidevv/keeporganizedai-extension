import { useDroppable } from '@dnd-kit/core';
import { Star } from 'lucide-react';
import { useDndState } from '@/components/DndProvider';
import { cn } from '@/lib/utils';

function getContainerClassName(isOver: boolean): string {
  if (isOver) {
    return 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01] shadow-lg shadow-[var(--color-primary)]/10';
  }
  return 'border-muted/40 bg-muted/5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5';
}

function getIconContainerClassName(isOver: boolean): string {
  if (isOver) {
    return 'bg-[var(--color-primary)]/20';
  }
  return 'bg-muted/10';
}

function getTextClassName(isOver: boolean): string {
  if (isOver) {
    return 'text-[var(--color-primary)]';
  }
  return 'text-foreground';
}

function getDisplayText(isOver: boolean, title: string | undefined): string {
  if (isOver) {
    return `Pin "${title}" to Bookmarks Bar`;
  }
  return 'Drop here to pin to Bookmarks Bar';
}

export function BookmarkBarZone() {
  const { isDragging, activeItem } = useDndState();
  const { setNodeRef, isOver } = useDroppable({
    id: 'bookmark-bar-zone',
    disabled: !isDragging,
  });

  if (!isDragging) return null;

  const title = activeItem?.title ?? '';
  const typeLabel = activeItem?.type === 'folder' ? 'Folder' : 'Bookmark';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-3 mx-4 mb-3 rounded-xl border-2 border-dashed transition-all duration-300 animate-in slide-in-from-top-4 fade-in',
        getContainerClassName(isOver)
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200',
          getIconContainerClassName(isOver)
        )}
      >
        <Star
          className={cn(
            'w-4 h-4 transition-colors duration-200',
            isOver ? 'text-[var(--color-primary)]' : 'text-muted-foreground'
          )}
        />
      </div>

      <div className="flex flex-col items-center">
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            getTextClassName(isOver)
          )}
        >
          {getDisplayText(isOver, title)}
        </span>
        {activeItem && <span className="text-xs text-muted-foreground">{typeLabel}</span>}
      </div>
    </div>
  );
}
