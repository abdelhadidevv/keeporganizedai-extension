/* eslint-disable react/jsx-props-no-spreading */
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/Progress';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'progress' | 'dots';
  progress?: number;
  className?: string;
}

const variantStyles = {
  spinner: 'flex flex-col items-center justify-center',
  progress: 'flex flex-col items-center justify-center',
  dots: 'flex flex-col items-center justify-center',
};

function DotsIndicator() {
  return (
    <div className="flex items-center justify-center gap-1" aria-label="Loading">
      <span
        className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
        style={{
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '-0.32s',
        }}
      />
      <span
        className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
        style={{
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '-0.16s',
        }}
      />
      <span
        className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
        style={{
          animation: 'bounce 1.4s infinite ease-in-out both',
        }}
      />
    </div>
  );
}

export function LoadingState({
  message,
  variant = 'spinner',
  progress = 0,
  className,
}: LoadingStateProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      className={cn(
        'animate-in fade-in rounded-lg bg-muted/5 p-6',
        variantStyles[variant],
        className
      )}
      role="status"
      aria-live="polite"
    >
      {variant === 'spinner' && <Spinner size="lg" />}

      {variant === 'progress' && (
        <div className="w-full max-w-xs">
          <Progress value={clampedProgress} />
        </div>
      )}

      {variant === 'dots' && <DotsIndicator />}

      {message && <p className="mt-3 text-sm text-muted">{message}</p>}
    </div>
  );
}

export type LoadingPreset = {
  analyzingBookmarks: { message: string; variant: 'dots' };
  categorizing: { message: string; variant: 'progress'; progress: number };
  organizing: { message: string; variant: 'progress'; progress: number };
  finalizing: { message: string; variant: 'progress'; progress: number };
  loadingBookmarks: { message: string; variant: 'spinner' };
  processing: { message: string; variant: 'dots' };
};

export const LOADING_PRESETS: LoadingPreset = {
  analyzingBookmarks: {
    message: 'Analyzing your bookmarks...',
    variant: 'dots',
  },
  categorizing: {
    message: 'Categorizing bookmarks...',
    variant: 'progress',
    progress: 33,
  },
  organizing: {
    message: 'Organizing folders...',
    variant: 'progress',
    progress: 66,
  },
  finalizing: {
    message: 'Finalizing...',
    variant: 'progress',
    progress: 90,
  },
  loadingBookmarks: {
    message: 'Loading bookmarks...',
    variant: 'spinner',
  },
  processing: {
    message: 'Processing...',
    variant: 'dots',
  },
};

export function createLoadingState(
  preset: keyof LoadingPreset,
  overrides?: Partial<LoadingStateProps>
): LoadingStateProps {
  const presetConfig = LOADING_PRESETS[preset];
  return {
    ...presetConfig,
    ...overrides,
  };
}
