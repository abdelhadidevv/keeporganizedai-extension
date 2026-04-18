/* eslint-disable react/jsx-props-no-spreading */
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  message: string;
  retryAction?: () => void;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

const DEFAULT_TITLE = 'Something went wrong';

export function ErrorState({
  message,
  retryAction,
  title = DEFAULT_TITLE,
  icon,
  className,
}: ErrorStateProps) {
  const defaultIcon = <AlertCircle className="w-6 h-6 text-[var(--color-error)]" />;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 animate-in fade-in',
        className
      )}
    >
      <div className="rounded-full bg-[var(--color-error)]/10 p-3 mb-3">{icon || defaultIcon}</div>
      <p className="text-base font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {retryAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={retryAction}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try again
        </Button>
      )}
    </div>
  );
}

export const ERROR_PRESETS = {
  loadBookmarks: {
    title: 'Failed to load bookmarks',
    message: 'Could not retrieve your bookmarks. Please try again.',
  },
  saveFailed: {
    title: 'Failed to save changes',
    message: 'Your changes could not be saved. Please try again.',
  },
  networkError: {
    title: 'Network error',
    message: 'Please check your internet connection and try again.',
  },
  aiError: {
    title: 'AI processing failed',
    message: 'The AI service encountered an error. Please try again.',
  },
} as const;

export type ErrorPresetKey = keyof typeof ERROR_PRESETS;

export function createErrorState(
  presetKey: ErrorPresetKey,
  overrides?: Partial<Pick<ErrorStateProps, 'retryAction' | 'icon' | 'className'>>
): ErrorStateProps {
  return {
    ...ERROR_PRESETS[presetKey],
    ...overrides,
  };
}
