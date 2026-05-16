/* eslint-disable react/jsx-props-no-spreading */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/Progress';

export interface LoadingStateProps {
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
  const { t } = useTranslation('common');
  return (
    <div
      className="flex items-center justify-center gap-1"
      aria-label={t('loading_state.aria_label')}
    >
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

function valueOrDefault<T>(value: T | undefined, fallback: T): T {
  return value !== undefined ? value : fallback;
}

export function LoadingState({
  message: messageProp,
  variant = 'spinner',
  progress = 0,
  className,
}: LoadingStateProps) {
  const { t } = useTranslation('common');
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const message = valueOrDefault(messageProp, t('loading_state.loading_bookmarks'));

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

      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
