/* eslint-disable react/jsx-props-no-spreading */
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const { t } = useTranslation('common');
  return (
    <div
      role="status"
      aria-label={t('spinner.aria_label')}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn(sizeMap[size], 'animate-spin text-[var(--color-primary)]')} />
      <span className="sr-only">{t('loader.default_label')}</span>
    </div>
  );
}

interface LoaderProps extends SpinnerProps {
  label?: string;
}

function Loader({ className, label, size = 'md', ...props }: LoaderProps) {
  const { t } = useTranslation('common');
  const displayLabel = label ?? t('loader.default_label');
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-label={displayLabel}
      {...props}
    >
      <Spinner size={size} />
      <span className="text-sm text-muted">{displayLabel}</span>
    </div>
  );
}

export { Spinner, Loader };
