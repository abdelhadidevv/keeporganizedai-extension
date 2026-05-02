import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  className,
  disabled = false,
  fullWidth = false,
}: SelectProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-between gap-2 rounded-lg border',
            'border-muted/30 bg-background px-3 py-2 text-sm',
            'transition-colors hover:border-muted/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
            'disabled:pointer-events-none disabled:opacity-50',
            fullWidth && 'w-full',
            className
          )}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon}
            <span className={cn(!selectedOption && 'text-muted')}>
              {selectedOption?.label || placeholder}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="start"
          sideOffset={4}
          style={{ minWidth: fullWidth ? 'var(--radix-dropdown-menu-trigger-width)' : undefined }}
          className={cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border',
            'border-muted/20 bg-background p-1 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'dark:border-muted/30',
            fullWidth && 'w-full'
          )}
        >
          {options.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option.value}
              onSelect={() => onValueChange(option.value)}
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-2 rounded-md',
                'px-2 py-2 text-sm outline-none transition-colors',
                'focus:bg-muted/10',
                'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                option.value === value && 'bg-[var(--color-primary)]/10'
              )}
            >
              {option.icon && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted">
                  {option.icon}
                </span>
              )}
              <span className="flex-1 font-medium">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
