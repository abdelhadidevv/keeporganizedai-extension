import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { useDndState } from '@/components/DndProvider';
import { cn } from '@/lib/utils';

function getContainerClassName(isOver: boolean): string {
  if (isOver) {
    return 'border-[var(--color-error)] bg-[var(--color-error)]/10 scale-[1.02] shadow-lg shadow-[var(--color-error)]/10';
  }
  return 'border-muted/40 bg-muted/5 hover:border-[var(--color-error)]/50 hover:bg-[var(--color-error)]/5';
}

function getIconContainerClassName(isOver: boolean): string {
  if (isOver) {
    return 'bg-[var(--color-error)]/20';
  }
  return 'bg-muted/10';
}

function getTextClassName(isOver: boolean): string {
  if (isOver) {
    return 'text-[var(--color-error)]';
  }
  return 'text-foreground';
}

export function TrashZone() {
  const { t } = useTranslation('common');
  const { isDragging, activeItem } = useDndState();
  const { setNodeRef, isOver } = useDroppable({
    id: 'trash-zone',
    disabled: !isDragging,
  });

  if (!isDragging) return null;

  const title = activeItem?.title ?? '';
  const typeLabel =
    activeItem?.type === 'folder' ? t('trash_zone.type_folder') : t('trash_zone.type_bookmark');

  const getDisplayText = (isOverVal: boolean, ttl: string | undefined): string => {
    if (isOverVal) {
      return t('trash_zone.delete_title', { title: ttl });
    }
    return t('trash_zone.drop_hint');
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-3 mx-4 mb-3 rounded-xl border-2 border-dashed transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in',
        getContainerClassName(isOver)
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200',
          getIconContainerClassName(isOver)
        )}
      >
        <Trash2
          className={cn(
            'w-4 h-4 transition-colors duration-200',
            isOver ? 'text-[var(--color-error)]' : 'text-muted-foreground'
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
