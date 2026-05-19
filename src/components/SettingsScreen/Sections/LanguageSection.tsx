import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Select } from '@/components/ui';

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

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

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
          <Select
            value={current}
            onValueChange={handleChange}
            options={[...LANGUAGES]}
          />
        </div>
      </div>
    </section>
  );
}
