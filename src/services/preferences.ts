import { AIProvider } from '@/types';
import { getSync, setSync, type Theme } from './storage';

export interface UserPreferences {
  aiProvider: AIProvider;
  theme: Theme;
}

const defaultPreferences: UserPreferences = {
  aiProvider: 'gemini',
  theme: 'system',
};

async function getUserPreferences(): Promise<UserPreferences> {
  const prefs = await getSync<UserPreferences>('userPreferences');
  if (!prefs) {
    return defaultPreferences;
  }
  return { ...defaultPreferences, ...prefs };
}

async function setUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const existing = await getUserPreferences();
  const merged = { ...existing, ...prefs };
  await setSync('userPreferences', merged);
}

export const preferencesService = {
  getUserPreferences,
  setUserPreferences,
};
