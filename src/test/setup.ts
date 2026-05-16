import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/i18n/locales/en/common.json';

i18n.use(initReactI18next).init({
  resources: { en: { common: enCommon } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

afterEach(() => {
  cleanup();
});

vi.mock('chrome', () => ({
  runtime: {
    lastError: null,
  },
  bookmarks: {
    getTree: vi.fn(),
    getBookmarks: vi.fn(),
    create: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    removeTree: vi.fn(),
    search: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
}));
