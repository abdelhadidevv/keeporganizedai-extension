/* eslint-disable react/jsx-props-no-spreading */
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
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn(sizeMap[size], 'animate-spin text-[var(--color-primary)]')} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoaderProps extends SpinnerProps {
  label?: string;
}

function Loader({ className, label = 'Loading...', size = 'md', ...props }: LoaderProps) {
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <Spinner size={size} />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export { Spinner, Loader };
