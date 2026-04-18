'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getSync } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

function ThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const syncFromStorage = async () => {
      const savedTheme = await getSync<string>(STORAGE_KEYS.THEME);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    syncFromStorage();

    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      const newTheme = changes[STORAGE_KEYS.THEME]?.newValue;
      if (newTheme && typeof newTheme === 'string') {
        setTheme(newTheme);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [setTheme]);

  return null;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return children;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
