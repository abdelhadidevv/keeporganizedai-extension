import { useTranslation } from 'react-i18next';
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

export function BookmarkBarZone() {
  const { t } = useTranslation('common');
  const { isDragging, activeItem } = useDndState();
  const { setNodeRef, isOver } = useDroppable({
    id: 'bookmark-bar-zone',
    disabled: !isDragging,
  });

  if (!isDragging) return null;

  const title = activeItem?.title ?? '';
  const typeLabel =
    activeItem?.type === 'folder'
      ? t('bookmark_bar_zone.type_folder')
      : t('bookmark_bar_zone.type_bookmark');

  const getDisplayText = (isOverVal: boolean, ttl: string | undefined): string => {
    if (isOverVal) {
      return t('bookmark_bar_zone.pin_title', { title: ttl });
    }
    return t('bookmark_bar_zone.drop_hint');
  };

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
          {getDisplayText(isOver, title) as string}
        </span>
        {activeItem && <span className="text-xs text-muted-foreground">{typeLabel}</span>}
      </div>
    </div>
  );
}
