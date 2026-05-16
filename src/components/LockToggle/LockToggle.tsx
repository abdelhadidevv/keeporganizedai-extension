/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Lock, Unlock, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { lockStateService } from '@/services/lockState';
import type { LockType } from '@/types/index';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface LockToggleProps {
  folderId: string;
  currentLockState: LockType;
  onChange?: (newState: LockType) => void;
  className?: string;
  disabled?: boolean;
}

interface LockOption {
  value: LockType;
  label: string;
  icon: React.ReactNode;
  description: string;
  variant: 'default' | 'destructive' | 'warning';
}

const stateStyles: Record<LockType, string> = {
  none: 'bg-muted/10 text-muted border-muted/20 hover:bg-muted/20',
  smart:
    'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20 hover:bg-[var(--color-warning)]/20',
  hard: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/20',
};

export function LockToggle({
  folderId,
  currentLockState,
  onChange,
  className,
  disabled = false,
}: LockToggleProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showHardLockConfirm, setShowHardLockConfirm] = React.useState(false);

  const LOCK_OPTIONS: LockOption[] = [
    {
      value: 'none',
      label: t('lock_toggle.none'),
      icon: <Unlock className="h-4 w-4" />,
      description: t('lock_toggle.none_description'),
      variant: 'default',
    },
    {
      value: 'hard',
      label: t('lock_toggle.hard_lock'),
      icon: <Lock className="h-4 w-4" />,
      description: t('lock_toggle.hard_lock_description'),
      variant: 'destructive',
    },
  ];

  const currentOption = LOCK_OPTIONS.find((o) => o.value === currentLockState) ?? LOCK_OPTIONS[0];

  const handleSelect = React.useCallback(
    async (option: LockOption) => {
      if (option.value === currentLockState) {
        setIsOpen(false);
        return;
      }

      if (option.value === 'hard') {
        setIsOpen(false);
        setShowHardLockConfirm(true);
        return;
      }

      if (option.value === 'smart') {
        toast.warning(t('lock_toggle.smart_lock_applied'), {
          description: option.description,
          icon: <Sparkles className="h-4 w-4" />,
        });
      }

      await applyLockState(option.value);
    },
    [currentLockState, t]
  );

  const applyLockState = React.useCallback(
    async (newState: LockType) => {
      setIsOpen(false);
      setIsLoading(true);
      try {
        await lockStateService.setLockState(folderId, newState);
        onChange?.(newState);
      } catch {
        toast.error(t('lock_toggle.failed_to_update'));
      } finally {
        setIsLoading(false);
      }
    },
    [folderId, onChange]
  );

  const handleConfirmHardLock = React.useCallback(async () => {
    setShowHardLockConfirm(false);
    await applyLockState('hard');
  }, [applyLockState]);

  return (
    <div className="select-none">
      <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled || isLoading}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
              'disabled:pointer-events-none disabled:opacity-50',
              stateStyles[currentLockState],
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="shrink-0">{currentOption.icon}</span>
            )}
            <span>{currentOption.label}</span>
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            sideOffset={4}
            className={cn(
              'z-50 min-w-[200px] overflow-hidden rounded-lg border',
              'border-muted/20 bg-background p-1 shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
          >
            {LOCK_OPTIONS.map((option) => (
              <DropdownMenuPrimitive.Item
                key={option.value}
                onSelect={() => handleSelect(option)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-md',
                  'px-2 py-2 text-sm outline-none transition-colors',
                  'focus:bg-muted/10',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  option.value === currentLockState && 'bg-[var(--color-primary)]/10'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                    option.variant === 'destructive' &&
                      'bg-[var(--color-error)]/10 text-[var(--color-error)]',
                    option.variant === 'warning' &&
                      'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
                    option.variant === 'default' && 'bg-muted/10 text-muted'
                  )}
                >
                  {option.icon}
                </span>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
                {option.value === currentLockState && (
                  <span className="ml-auto text-xs text-[var(--color-primary)]">
                    {t('lock_toggle.active')}
                  </span>
                )}
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>

      <Modal open={showHardLockConfirm} onOpenChange={setShowHardLockConfirm}>
        <ModalContent className="max-w-[420px]">
          <ModalHeader>
            <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error/10">
              <AlertTriangle className="h-6 w-6 text-error" />
            </div>
            <ModalTitle>{t('lock_toggle.confirm_title')}</ModalTitle>
            <ModalDescription>{t('lock_toggle.confirm_message')}</ModalDescription>
          </ModalHeader>
          <ModalBody />
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowHardLockConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmHardLock}>
              {t('lock_toggle.confirm_button')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
