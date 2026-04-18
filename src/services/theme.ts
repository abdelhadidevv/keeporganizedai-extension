import { STORAGE_KEYS, getSync, setSync, type Theme } from './storage';

export type { Theme };

async function getTheme(): Promise<Theme> {
  const saved = await getSync<Theme>(STORAGE_KEYS.THEME);
  return saved ?? 'system';
}

async function setTheme(theme: Theme): Promise<void> {
  await setSync(STORAGE_KEYS.THEME, theme);
}

export { getTheme, setTheme };
