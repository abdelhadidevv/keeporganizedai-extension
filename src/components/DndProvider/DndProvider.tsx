import { useCallback, useState, type ReactNode } from 'react';
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
  lockStates: Record<string, 'none' | 'hard' | 'smart'>;
}

export interface DropTargetInfo {
  id: string;
  position: 'before' | 'after' | 'inside';
}

export function DndProvider({ children, onMove, onRefresh, lockStates }: DndProviderProps) {
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

  const canDropOnTarget = useCallback(
    (targetId: string): boolean => {
      if (!activeItem) return false;
      if (activeItem.node.id === targetId) return false;
      const lockType = lockStates[targetId];
      if (lockType === 'hard') return false;
      return true;
    },
    [activeItem, lockStates]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as DragData;
    setActiveItem(data);
    setDropTargetInfo(null);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over || !activeItem) {
        setDropTargetInfo(null);
        return;
      }

      const overData = over.data.current as { type?: string; parentId?: string | null };
      const overId = over.id as string;

      if (overData.type === 'folder' && canDropOnTarget(overId)) {
        const lockType = lockStates[overId];
        if (lockType === 'hard') {
          setDropTargetInfo(null);
          return;
        }
        setDropTargetInfo({ id: overId, position: 'inside' });
      } else if (overData.type === 'bookmark') {
        setDropTargetInfo({ id: overId, position: 'before' });
      }
    },
    [activeItem, canDropOnTarget, lockStates]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);
      setDropTargetInfo(null);

      if (!over) return;

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
        const targetParentId = overParentId ?? '0';
        try {
          await onMove(activeId, sourceParentId, targetParentId, 0);
          toast.success('Reordered successfully');
          onRefresh();
        } catch {
          toast.error('Failed to reorder');
        }
        return;
      }

      let targetParentId: string;

      if (overData.type === 'folder' && lockStates[overId] !== 'hard') {
        targetParentId = overId;
      } else if (overData.parentId) {
        targetParentId = overData.parentId;
      } else {
        return;
      }

      try {
        await onMove(activeId, sourceParentId, targetParentId, 0);
        toast.success('Moved successfully');
        onRefresh();
      } catch {
        toast.error('Failed to move item');
      }
    },
    [onMove, onRefresh, lockStates]
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
    setDropTargetInfo(null);
  }, []);

  return (
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
          <div className="opacity-80 bg-background border border-border rounded-lg shadow-lg p-2 px-3 text-sm font-medium">
            {activeItem.node.title || 'Untitled'}
          </div>
        )}
      </DragOverlay>
      {dropTargetInfo && activeItem && (
        <DropIndicator targetId={dropTargetInfo.id} position={dropTargetInfo.position} />
      )}
    </DndContext>
  );
}

export type { DragData };
