/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, wrapperClassName, ...props }, ref) => (
    <div className={cn('relative', wrapperClassName)}>
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-secondary)]">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[var(--color-secondary)]/30 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-[var(--color-secondary)] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-[var(--color-secondary)]/50',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        ref={ref}
        {...props}
      />
      {rightIcon && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-secondary)]">
          {rightIcon}
        </span>
      )}
    </div>
  )
);
Input.displayName = 'Input';

export { Input };
