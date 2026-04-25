import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui';
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
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-muted/20 select-none',
        'bg-background',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-primary font-logo">
          KeepOrganizedAI
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
            Auto-Organize
          </Button>
        )}
      </div>
    </header>
  );
}
