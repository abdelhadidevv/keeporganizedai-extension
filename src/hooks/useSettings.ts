import { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AIProvider } from '@/types';
import { AIApiKeys, DEFAULT_MODEL } from '@/types/ai';
import { get, getSync, set, setSync } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';

type ModelSelection = Record<AIProvider, string>;

interface UseSettingsReturn {
  aiProvider: AIProvider;
  theme: string;
  isLoading: boolean;
  apiKeys: AIApiKeys;
  modelSelections: ModelSelection;
  setApiKey: (provider: AIProvider, key: string) => Promise<void>;
  clearApiKey: (provider: AIProvider) => Promise<void>;
  setAIProvider: (provider: AIProvider) => Promise<void>;
  setModel: (provider: AIProvider, model: string) => Promise<void>;
  setTheme: (theme: string) => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [aiProvider, setAIProviderState] = useState<AIProvider>('gemini');
  const [theme, setThemeState] = useState<string>('system');
  const [apiKeys, setApiKeysState] = useState<AIApiKeys>({});
  const [modelSelections, setModelSelectionsState] = useState<ModelSelection>({
    gemini: DEFAULT_MODEL.gemini,
    claude: DEFAULT_MODEL.claude,
    openai: DEFAULT_MODEL.openai,
    ollama: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme: setNextTheme } = useTheme();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [provider, themePref, apiKeysData, modelSelectionsData] = await Promise.all([
        getSync<AIProvider>(STORAGE_KEYS.AI_PROVIDER),
        getSync<string>(STORAGE_KEYS.THEME),
        get<AIApiKeys>(STORAGE_KEYS.API_KEYS),
        getSync<ModelSelection>(STORAGE_KEYS.MODEL_SELECTIONS),
      ]);

      if (provider) {
        setAIProviderState(provider);
      }
      if (themePref) {
        setThemeState(themePref);
      }
      if (apiKeysData) {
        setApiKeysState(apiKeysData);
      }
      if (modelSelectionsData) {
        setModelSelectionsState({
          ...{
            gemini: DEFAULT_MODEL.gemini,
            claude: DEFAULT_MODEL.claude,
            openai: DEFAULT_MODEL.openai,
            ollama: '',
          },
          ...modelSelectionsData,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setAIProvider = useCallback(async (provider: AIProvider) => {
    try {
      await setSync(STORAGE_KEYS.AI_PROVIDER, provider);
      setAIProviderState(provider);
    } catch (error) {
      console.error('Failed to save AI provider:', error);
      throw error;
    }
  }, []);

  const setTheme = useCallback(
    async (themePref: string) => {
      try {
        await setSync(STORAGE_KEYS.THEME, themePref);
        setThemeState(themePref);
        setNextTheme(themePref);
      } catch (error) {
        console.error('Failed to save theme:', error);
        throw error;
      }
    },
    [setNextTheme]
  );

  const setModel = useCallback(
    async (provider: AIProvider, model: string) => {
      try {
        const newModelSelections = { ...modelSelections, [provider]: model };
        await setSync(STORAGE_KEYS.MODEL_SELECTIONS, newModelSelections);
        setModelSelectionsState(newModelSelections);
      } catch (error) {
        console.error('Failed to save model selection:', error);
        throw error;
      }
    },
    [modelSelections]
  );

  const setApiKey = useCallback(
    async (provider: AIProvider, key: string) => {
      try {
        const newKeys = { ...apiKeys, [provider]: key };
        await set(STORAGE_KEYS.API_KEYS, newKeys);
        setApiKeysState(newKeys);
      } catch (error) {
        console.error('Failed to save API key:', error);
        throw error;
      }
    },
    [apiKeys]
  );

  const clearApiKey = useCallback(
    async (provider: AIProvider) => {
      try {
        const newKeys = { ...apiKeys } as Record<string, string | undefined>;
        delete newKeys[provider];
        await set(STORAGE_KEYS.API_KEYS, newKeys);
        setApiKeysState(newKeys as AIApiKeys);
      } catch (error) {
        console.error('Failed to clear API key:', error);
        throw error;
      }
    },
    [apiKeys]
  );

  return {
    aiProvider,
    theme,
    isLoading,
    apiKeys,
    modelSelections,
    setApiKey,
    clearApiKey,
    setAIProvider,
    setModel,
    setTheme,
  };
}
