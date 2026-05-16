/* eslint-disable react/jsx-props-no-spreading */
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  message: string;
  retryAction?: () => void;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  message,
  retryAction,
  title: titleProp,
  icon,
  className,
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  const title = titleProp ?? t('error_state.default_title');
  const defaultIcon = <AlertCircle className="w-6 h-6 text-error" />;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 animate-in fade-in',
        className
      )}
    >
      <div className="rounded-full bg-error/10 p-3 mb-3 text-error">{icon || defaultIcon}</div>
      <p className="text-base font-semibold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {retryAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={retryAction}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {t('error_state.retry_button')}
        </Button>
      )}
    </div>
  );
}
