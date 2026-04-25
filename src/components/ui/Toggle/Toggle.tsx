/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-transparent hover:bg-muted/10 data-[state=on]:bg-[var(--color-primary)] data-[state=on]:text-white',
        outline:
          'border border-muted/30 hover:bg-muted/10 data-[state=on]:border-[var(--color-primary)] data-[state=on]:bg-[var(--color-primary-light)] data-[state=on]:text-[var(--color-primary)]',
        ghost: 'bg-transparent hover:bg-muted/10 data-[state=on]:bg-muted/20',
        filled:
          'bg-muted/10 hover:bg-muted/20 data-[state=on]:bg-[var(--color-primary)] data-[state=on]:text-white',
      },
      size: {
        default: 'h-10 min-w-10 px-3 py-2',
        sm: 'h-8 min-w-8 px-2 text-xs',
        lg: 'h-12 min-w-12 px-4 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
