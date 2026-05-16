import { useTranslation } from 'react-i18next';
import { Wand2 } from 'lucide-react';
import { Button, ThemedIcon } from '@/components/ui';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onAutoOrganize?: () => void;
  isAutoOrganizeDisabled?: boolean;
  isAutoOrganizeLoading?: boolean;
  className?: string;
}

export function Header({
  onAutoOrganize,
  isAutoOrganizeDisabled = false,
  isAutoOrganizeLoading = false,
  className,
}: HeaderProps) {
  const { t } = useTranslation('common');
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-muted/20 select-none',
        'bg-background',
        className
      )}
    >
      <div className="flex items-center gap-1" dir="ltr">
        <ThemedIcon
          light="/logo-light.svg"
          dark="/logo-dark.svg"
          alt="KeepOrganizedAI"
          className="w-7 h-7"
        />
        <h1 className="text-[18px] font-medium text-center h-max ">
          KeepOrganized
          <span className="text-primary">AI</span>
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {onAutoOrganize && (
          <Button
            variant="default"
            size="sm"
            onClick={onAutoOrganize}
            disabled={isAutoOrganizeDisabled || isAutoOrganizeLoading}
            loading={isAutoOrganizeLoading}
            leftIcon={!isAutoOrganizeLoading ? <Wand2 className="w-4 h-4" /> : undefined}
          >
            {t('header.auto_organize')}
          </Button>
        )}
      </div>
    </header>
  );
}
