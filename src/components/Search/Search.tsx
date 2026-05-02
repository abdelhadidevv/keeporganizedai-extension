/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  debounceMs?: number;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  wrapperClassName?: string;
}

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      placeholder = 'Search...',
      debounceMs = 300,
      onChange,
      onSearch,
      value,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const internalInputRef = React.useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalInputRef;
    const [internalValue, setInternalValue] = React.useState('');
    const composingRef = React.useRef(false);

    const controlledValue = value !== undefined ? String(value) : internalValue;
    const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const onSearchRef = React.useRef(onSearch);
    onSearchRef.current = onSearch;

    React.useEffect(
      () => () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      },
      []
    );

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        if (debounceMs > 0) {
          debounceTimerRef.current = setTimeout(() => {
            if (!composingRef.current) {
              onSearchRef.current?.(newValue);
            }
          }, debounceMs);
        } else {
          onSearchRef.current?.(newValue);
        }
      },
      [value, onChange, debounceMs]
    );

    const handleClear = React.useCallback(() => {
      if (value === undefined) {
        setInternalValue('');
      }
      onChange?.('');
      onSearchRef.current?.('');
      const input = 'current' in inputRef ? inputRef.current : null;
      input?.focus();
    }, [value, onChange, inputRef]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          onSearchRef.current?.(controlledValue);
        }
      },
      [controlledValue]
    );

    const handleCompositionStart = React.useCallback(() => {
      composingRef.current = true;
    }, []);

    const handleCompositionEnd = React.useCallback(
      (e: React.CompositionEvent<HTMLInputElement>) => {
        composingRef.current = false;
        const newValue = e.currentTarget.value;
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (debounceMs > 0) {
          debounceTimerRef.current = setTimeout(() => {
            onSearchRef.current?.(newValue);
          }, debounceMs);
        }
      },
      [value, onChange, debounceMs]
    );

    const hasValue = controlledValue.length > 0;

    return (
      <div className={cn('w-full relative', wrapperClassName)}>
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          role="searchbox"
          aria-label="Search"
          className={cn(
            'flex h-10 w-full rounded-lg border border-muted/30 bg-transparent px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-muted/50',
            'pl-10',
            className
          )}
          placeholder={placeholder}
          value={controlledValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          ref={inputRef}
          {...props}
        />
        {hasValue && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted hover:text-foreground"
              onClick={handleClear}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={14} />
            </Button>
          </span>
        )}
      </div>
    );
  }
);

Search.displayName = 'Search';
