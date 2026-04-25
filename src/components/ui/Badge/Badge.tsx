/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--color-primary)] text-white',
        secondary: 'border-transparent bg-muted/10 text-muted',
        outline: 'border-muted/30 text-muted',
        destructive: 'border-transparent bg-[var(--color-error)] text-white',
        success: 'border-transparent bg-[var(--color-success)] text-white',
        warning: 'border-transparent bg-[var(--color-warning)] text-white',
        info: 'border-transparent bg-[var(--color-info)] text-white',
        accent: 'border-transparent bg-[var(--color-accent)] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
