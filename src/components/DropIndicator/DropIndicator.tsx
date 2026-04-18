import { useEffect, useState } from 'react';

interface DropIndicatorProps {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

export function DropIndicator({ targetId, position }: DropIndicatorProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const targetElement = document.querySelector(`[data-draggable-id="${targetId}"]`);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    if (position === 'before') {
      setStyle({
        position: 'fixed',
        top: rect.top + scrollTop - 2,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: 2,
        backgroundColor: '#3B82F6',
        borderRadius: 1,
        zIndex: 9999,
        pointerEvents: 'none',
      });
    } else if (position === 'after') {
      setStyle({
        position: 'fixed',
        top: rect.bottom + scrollTop + 2,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: 2,
        backgroundColor: '#3B82F6',
        borderRadius: 1,
        zIndex: 9999,
        pointerEvents: 'none',
      });
    }
  }, [targetId, position]);

  return <div style={style} />;
}
