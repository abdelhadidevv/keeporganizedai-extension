import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'ar', label: 'العربية' },
] as const;

export function LanguageSection() {
  const { t, i18n } = useTranslation('common');
  const [current, setCurrent] = useState(() => i18n.resolvedLanguage || i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrent(lng);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      i18n.changeLanguage(e.target.value);
    },
    [i18n]
  );

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
        {t('settings.language.heading')}
      </h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('settings.language.label')}</span>
          </div>
          <select
            value={current}
            onChange={handleChange}
            className={cn(
              'rounded-lg border border-muted/30 bg-background px-3 py-2 pe-8 text-sm',
              'transition-colors hover:border-muted/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
              'appearance-none bg-no-repeat',
              'bg-[length:16px]',
              '[background-position:right_8px_center]',
              'rtl:[background-position:left_8px_center]',
              'bg-[url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjYgOSAxMiAxNSAxOCA5Ij48L3BvbHlsaW5lPjwvc3ZnPg==)]'
            )}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
