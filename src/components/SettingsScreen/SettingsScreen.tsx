import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { VERSION } from '@/utils/constants';
import { AIProviderSection } from './Sections/AIProviderSection';
import { LanguageSection } from './Sections/LanguageSection';
import { ThemeSection } from './Sections/ThemeSection';
import { ImportExportSection } from './Sections/ImportExportSection';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t } = useTranslation('common');
  const { isLoading } = useSettings();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'border-b border-muted/20',
          'bg-muted/5'
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label={t('settings.back_aria_label')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-semibold">{t('settings.title')}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <AIProviderSection isLoading={isLoading} />
        <ThemeSection />
        <LanguageSection />
        <ImportExportSection />
      </main>

      <footer
        className={cn(
          'flex items-center justify-between px-4 py-3 select-none h-14.25',
          'border-t border-muted/20',
          'bg-muted/5'
        )}
      >
        <span className="text-xs text-muted-foreground">
          {t('settings.footer_version', { version: VERSION })}
        </span>
      </footer>
    </div>
  );
}
