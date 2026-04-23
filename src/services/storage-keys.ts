export const STORAGE_KEYS = {
  THEME: 'theme',
  LOCK_STATES: 'lockStates',
  WIZARD_STATE: 'wizardState',
  USER_PREFERENCES: 'userPreferences',
  CATEGORIES: 'categories',
  ASSIGNMENTS: 'assignments',
  AI_PROVIDER: 'aiProvider',
  API_KEYS: 'apiKeys',
  MODEL_SELECTIONS: 'modelSelections',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
