import { Sun, Moon, Monitor } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { Toggle } from '@/components/ui';

export function ThemeSection() {
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
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">Appearance</h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getThemeIcon()}
            <span className="text-sm font-medium">Theme</span>
          </div>
          <Toggle
            pressed={theme === 'dark'}
            onPressedChange={cycleTheme}
            variant="outline"
            size="sm"
            aria-label={`Current theme: ${getThemeLabel()}. Click to change.`}
          >
            {getThemeIcon()}
          </Toggle>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {'Current: '}
          {getThemeLabel()}
        </p>
      </div>
    </section>
  );
}
