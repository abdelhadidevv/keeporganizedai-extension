import { Toaster as SonnerToaster } from 'sonner';

function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-lg border border-[var(--color-secondary)]/20 bg-background p-4 shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-sm text-[var(--color-secondary)]',
          success:
            'border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]',
          error:
            'border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]',
          warning:
            'border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
          info: 'border-[var(--color-info)]/20 bg-[var(--color-info)]/10 text-[var(--color-info)]',
          icon: 'shrink-0',
          closeButton:
            'absolute right-2 top-2 rounded-sm opacity-70 transition-opacity hover:opacity-100',
        },
      }}
      expand
      richColors={false}
      closeButton
    />
  );
}

export { Toaster };
