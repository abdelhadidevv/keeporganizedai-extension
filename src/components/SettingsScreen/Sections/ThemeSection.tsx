import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { Toggle } from '@/components/ui';

export function ThemeSection() {
  const { t } = useTranslation('common');
  const { theme, setTheme } = useSettings();

  const getNextTheme = (currentTheme: string): string => {
    if (currentTheme === 'light') return 'dark';
    if (currentTheme === 'dark') return 'system';
    return 'light';
  };

  const cycleTheme = async () => {
    const newTheme = getNextTheme(theme);
    await setTheme(newTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('settings.theme.light');
      case 'dark':
        return t('settings.theme.dark');
      default:
        return t('settings.theme.system');
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
        {t('settings.theme.heading')}
      </h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getThemeIcon()}
            <span className="text-sm font-medium">{t('settings.theme.label')}</span>
          </div>
          <Toggle
            pressed={theme === 'dark'}
            onPressedChange={cycleTheme}
            variant="outline"
            size="sm"
            aria-label={t('settings.theme.aria_label', { theme: getThemeLabel() })}
          >
            {getThemeIcon()}
          </Toggle>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t('settings.theme.current', { theme: getThemeLabel() })}
        </p>
      </div>
    </section>
  );
}
