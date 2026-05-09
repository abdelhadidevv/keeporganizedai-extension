import { useEffect, useRef } from 'react';

interface DropIndicatorProps {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

function computeLineStyle(targetId: string, pos: 'before' | 'after'): React.CSSProperties | null {
  const targetElement = document.querySelector(`[data-draggable-id="${targetId}"]`);
  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();

  if (pos === 'before') {
    return {
      position: 'fixed',
      top: `${rect.top - 2}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: '2px',
      backgroundColor: 'var(--color-primary)',
      borderRadius: '1px',
      zIndex: 9999,
      pointerEvents: 'none',
    };
  }

  return {
    position: 'fixed',
    top: `${rect.bottom + 2}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: '2px',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '1px',
    zIndex: 9999,
    pointerEvents: 'none',
  };
}

function computeInsideStyle(targetId: string): React.CSSProperties | null {
  const targetElement = document.querySelector(`[data-draggable-id="${targetId}"]`);
  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();

  return {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px solid var(--color-primary)',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)/10',
    zIndex: 9998,
    pointerEvents: 'none',
    transition: 'all 0.15s ease',
  };
}

export function DropIndicator({ targetId, position }: DropIndicatorProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (position !== 'inside') {
      let animationFrameId: number;
      let lastStyle: React.CSSProperties | null = null;

      const updatePosition = () => {
        const newStyle = computeLineStyle(targetId, position as 'before' | 'after');
        if (newStyle && indicatorRef.current) {
          if (
            !lastStyle ||
            newStyle.top !== lastStyle.top ||
            newStyle.left !== lastStyle.left ||
            newStyle.width !== lastStyle.width
          ) {
            Object.assign(indicatorRef.current.style, newStyle);
            lastStyle = newStyle;
          }
        }
        animationFrameId = requestAnimationFrame(updatePosition);
      };

      animationFrameId = requestAnimationFrame(updatePosition);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }

    const newStyle = computeInsideStyle(targetId);
    if (newStyle && indicatorRef.current) {
      Object.assign(indicatorRef.current.style, newStyle);
    }

    return () => {};
  }, [targetId, position]);

  return <div ref={indicatorRef} />;
}
