import { useCallback, useState, createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { DropIndicator } from '@/components/DropIndicator/DropIndicator';

interface DragState {
  isDragging: boolean;
  activeItem: { type: 'folder' | 'bookmark'; title: string; id: string } | null;
}

const DndStateContext = createContext<DragState>({ isDragging: false, activeItem: null });

export function useDndState(): DragState {
  return useContext(DndStateContext);
}

interface DragData {
  type: 'folder' | 'bookmark';
  parentId: string | null;
  node: {
    id: string;
    title: string;
    url?: string;
    index?: number;
  };
}

interface DndProviderProps {
  children: ReactNode;
  onMove: (
    itemId: string,
    sourceParentId: string | null,
    targetParentId: string,
    targetIndex: number
  ) => Promise<boolean>;
  onRefresh: () => void;
  onTrash?: (itemId: string, type: 'folder' | 'bookmark') => void;
  onPinToBar?: (itemId: string, type: 'folder' | 'bookmark') => void;
}

export interface DropTargetInfo {
  id: string;
  position: 'before' | 'after' | 'inside';
}

function getSiblingIndexFromSortable(over: NonNullable<DragOverEvent['over']>): number {
  const nodeData = over.data.current?.node as { index?: number } | undefined;

  if (nodeData && typeof nodeData.index === 'number') {
    return nodeData.index;
  }

  const targetElement = document.querySelector(`[data-draggable-id="${over.id}"]`);
  if (!targetElement) return 0;

  const container = targetElement.parentElement;
  if (!container) return 0;

  const siblings = Array.from(container.children).filter((el) =>
    el.hasAttribute('data-draggable-id')
  );
  return siblings.indexOf(targetElement);
}

function getPointerY(event: DragOverEvent): number {
  const translatedRect = event.active.rect.current.translated;
  if (translatedRect) {
    return translatedRect.top + translatedRect.height / 2;
  }
  return 0;
}

export function DndProvider({
  children,
  onMove,
  onRefresh,
  onTrash,
  onPinToBar,
}: DndProviderProps) {
  const { t } = useTranslation('common');
  const [activeItem, setActiveItem] = useState<DragData | null>(null);
  const [dropTargetInfo, setDropTargetInfo] = useState<DropTargetInfo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData;
    setActiveItem(data);
    setDropTargetInfo(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over, active } = event;
      if (!over || !activeItem) {
        setDropTargetInfo(null);
        return;
      }

      if (over.id === 'trash-zone' || over.id === 'bookmark-bar-zone') {
        setDropTargetInfo(null);
        return;
      }

      const overData = over.data.current as { type?: string; parentId?: string | null };
      const overId = over.id as string;

      if (overData.type === 'folder') {
        const activeData = active.data.current as DragData | undefined;
        const isActiveFolder = activeData?.type === 'folder';
        const isSameParent = activeData?.parentId === overData.parentId;

        if (isActiveFolder) {
          if (!isSameParent) {
            setDropTargetInfo(null);
            return;
          }

          const pointerY = getPointerY(event);
          const { rect } = over;
          if (rect) {
            const middleY = rect.top + rect.height / 2;
            if (pointerY < middleY) {
              setDropTargetInfo({ id: overId, position: 'before' });
            } else {
              setDropTargetInfo({ id: overId, position: 'after' });
            }
          } else {
            setDropTargetInfo({ id: overId, position: 'inside' });
          }
        } else {
          setDropTargetInfo({ id: overId, position: 'inside' });
        }
      } else if (overData.type === 'bookmark') {
        const isActiveFolder = activeItem.type === 'folder';
        const isSameParent = activeItem.parentId === overData.parentId;

        if (isActiveFolder && !isSameParent) {
          setDropTargetInfo(null);
          return;
        }

        const pointerY = getPointerY(event);
        const { rect } = over;
        if (rect) {
          const middleY = rect.top + rect.height / 2;
          if (pointerY < middleY) {
            setDropTargetInfo({ id: overId, position: 'before' });
          } else {
            setDropTargetInfo({ id: overId, position: 'after' });
          }
        } else {
          setDropTargetInfo({ id: overId, position: 'before' });
        }
      }
    },
    [activeItem]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const dropPosition = dropTargetInfo?.position ?? 'inside';
      setActiveItem(null);
      setDropTargetInfo(null);

      if (!over) return;

      if (over.id === 'trash-zone') {
        const activeData = active.data.current as DragData;
        onTrash?.(activeData.node.id, activeData.type);
        return;
      }

      if (over.id === 'bookmark-bar-zone') {
        const activeData = active.data.current as DragData;
        onPinToBar?.(activeData.node.id, activeData.type);
        return;
      }

      const activeData = active.data.current as DragData;
      const activeId = active.id as string;
      const overId = over.id as string;
      const overData = over.data.current as { type?: string; parentId?: string | null };

      if (activeId === overId) return;

      const sourceParentId = activeData.parentId;
      const isFolder = activeData.type === 'folder';

      if (isFolder) {
        const overParentId = overData.parentId;
        if (sourceParentId !== overParentId) {
          return;
        }

        if (dropPosition === 'inside') {
          toast.warning(t('dnd_provider.cannot_move_folder'));
          return;
        }

        const targetParentId = overParentId ?? '0';
        const siblingIndex = getSiblingIndexFromSortable(over);
        const targetIndex = dropPosition === 'before' ? siblingIndex : siblingIndex + 1;

        try {
          await onMove(activeId, sourceParentId, targetParentId, targetIndex);
          onRefresh();
        } catch {
          toast.error(t('dnd_provider.failed_reorder'));
        }
        return;
      }

      let targetParentId: string;
      let targetIndex: number;

      if (overData.type === 'folder') {
        targetParentId = overId;
        targetIndex = 0;
      } else {
        targetParentId = overData.parentId ?? '0';
        const siblingIndex = getSiblingIndexFromSortable(over);
        targetIndex = dropPosition === 'before' ? siblingIndex : siblingIndex + 1;
      }

      try {
        await onMove(activeId, sourceParentId, targetParentId, targetIndex);
        onRefresh();
      } catch {
        toast.error(t('dnd_provider.failed_move'));
      }
    },
    [onMove, onRefresh, dropTargetInfo, onTrash, onPinToBar, t]
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setDropTargetInfo(null);
  }, []);

  const dragState = useMemo<DragState>(
    () => ({
      isDragging: activeItem !== null,
      activeItem: activeItem
        ? {
            type: activeItem.type,
            title: activeItem.node.title || t('bookmark_item.untitled'),
            id: activeItem.node.id,
          }
        : null,
    }),
    [activeItem, t]
  );

  return (
    <DndStateContext.Provider value={dragState}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay>
          {activeItem && (
            <div className="opacity-80 bg-background border border-muted/30 rounded-lg shadow-lg p-2 px-3 text-sm font-medium">
              {activeItem.node.title || t('bookmark_item.untitled')}
            </div>
          )}
        </DragOverlay>
        {dropTargetInfo && activeItem && (
          <DropIndicator targetId={dropTargetInfo.id} position={dropTargetInfo.position} />
        )}
      </DndContext>
    </DndStateContext.Provider>
  );
}

export type { DragData };
