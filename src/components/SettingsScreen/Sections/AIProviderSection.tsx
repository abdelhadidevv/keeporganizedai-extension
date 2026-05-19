/* eslint-disable no-nested-ternary */
/* eslint-disable object-curly-newline */
import { Eye, EyeOff, Check, AlertCircle, Key, Server, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { Spinner, Select, ThemedIcon } from '@/components/ui';
import type { AIProvider } from '@/types';
import { set } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';
import {
  GEMINI_MODELS,
  CLAUDE_MODELS,
  OPENAI_MODELS,
  BATCH_SIZE_MIN,
  BATCH_SIZE_MAX,
} from '@/types/ai';

interface AIProviderSectionProps {
  isLoading: boolean;
}

function getModelsForProvider(provider: AIProvider) {
  switch (provider) {
    case 'gemini':
      return GEMINI_MODELS;
    case 'claude':
      return CLAUDE_MODELS;
    case 'openai':
      return OPENAI_MODELS;
    case 'ollama':
      return [];
    default:
      return [];
  }
}

export function AIProviderSection({ isLoading }: AIProviderSectionProps) {
  const { t } = useTranslation('common');
  const {
    aiProvider,
    setAIProvider,
    apiKeys,
    modelSelections,
    batchConfig,
    setBatchConfig,
    setApiKey,
    setModel,
    clearApiKey,
  } = useSettings();

  const AI_PROVIDERS = [
    {
      value: 'gemini' as AIProvider,
      label: t('settings.ai_provider.providers.gemini'),
      icon: (
        <img
          src="/gemini.svg"
          alt={t('settings.ai_provider.providers.gemini')}
          className="w-4 h-4"
        />
      ),
    },
    {
      value: 'openai' as AIProvider,
      label: t('settings.ai_provider.providers.openai'),
      icon: (
        <ThemedIcon
          light="/openai-black.svg"
          dark="/openai-white.svg"
          alt={t('settings.ai_provider.providers.openai')}
        />
      ),
    },
    {
      value: 'claude' as AIProvider,
      label: t('settings.ai_provider.providers.claude'),
      icon: (
        <img
          src="/claude.svg"
          alt={t('settings.ai_provider.providers.claude')}
          className="w-4 h-4"
        />
      ),
    },
    {
      value: 'ollama' as AIProvider,
      label: t('settings.ai_provider.providers.ollama'),
      icon: <Server className="w-4 h-4" />,
    },
  ];

  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<{ name: string }[]>([]);
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const models = getModelsForProvider(aiProvider);
  const currentModel = modelSelections[aiProvider] || '';

  useEffect(() => {
    setKeyInput((apiKeys as Record<string, string | undefined>)[aiProvider] || '');
  }, [apiKeys, aiProvider]);

  useEffect(() => {
    const ollamaEndpoint = apiKeys.ollamaEndpoint || 'http://localhost:11434';
    setEndpointInput(ollamaEndpoint);
  }, [apiKeys.ollamaEndpoint]);

  const fetchOllamaModels = useCallback(
    async (autoSelect = false) => {
      const endpoint = apiKeys.ollamaEndpoint || 'http://localhost:11434';
      setIsLoadingOllamaModels(true);
      setOllamaError(null);
      try {
        const response = await fetch(`${endpoint}/api/tags`);
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        const data = await response.json();
        setOllamaModels(data.models || []);
        if (autoSelect && data.models?.length > 0 && !apiKeys.ollamaModel) {
          await setModel('ollama', data.models[0].name);
        }
      } catch (error) {
        setOllamaError(error instanceof Error ? error.message : 'Failed to connect to Ollama');
        setOllamaModels([]);
      } finally {
        setIsLoadingOllamaModels(false);
      }
    },
    [apiKeys.ollamaEndpoint, apiKeys.ollamaModel, setModel]
  );

  const hasFetchedModels = useRef(false);

  useEffect(() => {
    if (aiProvider === 'ollama' && !hasFetchedModels.current) {
      hasFetchedModels.current = true;
      fetchOllamaModels(true);
    } else if (aiProvider !== 'ollama') {
      hasFetchedModels.current = false;
    }
  }, [aiProvider]);

  const handleProviderChange = async (value: string) => {
    await setAIProvider(value as AIProvider);
  };

  const handleModelChange = async (value: string) => {
    await setModel(aiProvider, value);
  };

  const handleKeySave = async () => {
    if (aiProvider === 'ollama') return;
    if (keyInput.trim()) {
      await setApiKey(aiProvider, keyInput.trim());
    } else {
      await clearApiKey(aiProvider);
    }
  };

  const handleEndpointSave = async () => {
    const newKeys = { ...apiKeys, ollamaEndpoint: endpointInput };
    await set(STORAGE_KEYS.API_KEYS, newKeys);
    fetchOllamaModels();
  };

  const handleOllamaModelChange = async (value: string) => {
    await setModel('ollama', value);
    const newKeys = { ...apiKeys, ollamaModel: value };
    await set(STORAGE_KEYS.API_KEYS, newKeys);
  };

  const isOllama = aiProvider === 'ollama';
  const hasApiKey = isOllama || !!(apiKeys as Record<string, string | undefined>)[aiProvider];

  const getApiKeyPlaceholder = () => {
    if (isOllama) return t('settings.ai_provider.no_key_needed');
    return t('settings.ai_provider.api_key_placeholder', {
      provider: AI_PROVIDERS.find((p) => p.value === aiProvider)?.label ?? aiProvider,
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wider">
        {t('settings.ai_provider.heading')}
      </h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="block text-xs text-muted-foreground mb-2">
                {t('settings.ai_provider.provider_label')}
              </span>
              <Select
                fullWidth
                value={aiProvider}
                onValueChange={handleProviderChange}
                options={AI_PROVIDERS}
              />
            </div>

            {models.length > 0 && (
              <div>
                <span className="block text-xs text-muted-foreground mb-2">
                  {t('settings.ai_provider.model_label')}
                </span>
                <Select
                  fullWidth
                  value={currentModel}
                  onValueChange={handleModelChange}
                  options={[...models]}
                />
              </div>
            )}

            {isOllama ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Server className="w-3 h-3" />
                    <span className="text-xs">{t('settings.ai_provider.ollama_endpoint')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      onBlur={handleEndpointSave}
                      placeholder={t('settings.ai_provider.ollama_endpoint_placeholder')}
                      className={cn(
                        'flex-1 min-w-0 px-3 py-1.5 text-sm rounded-md',
                        'bg-background border border-muted/30',
                        'placeholder:text-muted-foreground/50',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('settings.ai_provider.model_label')}
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchOllamaModels(false)}
                      disabled={isLoadingOllamaModels}
                      className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      <RefreshCw
                        className={cn('w-3 h-3', isLoadingOllamaModels && 'animate-spin')}
                      />
                      {t('settings.ai_provider.refresh')}
                    </button>
                  </div>
                  {isLoadingOllamaModels ? (
                    <div className="flex items-center justify-center py-2">
                      <Spinner />
                    </div>
                  ) : ollamaError ? (
                    <div className="flex items-center gap-1 text-xs text-error">
                      <AlertCircle className="w-3 h-3" />
                      <span>{ollamaError}</span>
                    </div>
                  ) : ollamaModels.length > 0 ? (
                    <Select
                      fullWidth
                      value={apiKeys.ollamaModel || currentModel}
                      onValueChange={handleOllamaModelChange}
                      options={ollamaModels.map((m) => ({ value: m.name, label: m.name }))}
                    />
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-warning)]">
                      <AlertCircle className="w-3 h-3" />
                      <span>{t('settings.ai_provider.no_models_found')}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('settings.ai_provider.api_key_label')}
                  </span>
                  {apiKeys[aiProvider] && <Check className="w-3 h-3 text-[var(--color-success)]" />}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onBlur={handleKeySave}
                    placeholder={getApiKeyPlaceholder()}
                    className={cn(
                      'flex-1 min-w-0 px-3 py-1.5 text-sm rounded-md',
                      'bg-background border border-muted/30',
                      'placeholder:text-muted-foreground/50',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-md hover:bg-muted/10"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {!hasApiKey && (
                  <div className="flex items-center gap-1 text-xs text-[var(--color-warning)]">
                    <AlertCircle className="w-3 h-3" />
                    <span>{t('settings.ai_provider.api_key_required')}</span>
                  </div>
                )}
              </div>
            )}
            <div className="border-t border-muted/20 pt-4 space-y-3">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider">
                {t('settings.ai_provider.batch_heading')}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="batch-size"
                    className="block text-xs text-muted-foreground mb-1.5"
                  >
                    {t('settings.ai_provider.batch_size_label')}
                  </label>
                  <input
                    id="batch-size"
                    type="number"
                    min={BATCH_SIZE_MIN}
                    max={BATCH_SIZE_MAX}
                    value={batchConfig.batchSize}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= BATCH_SIZE_MIN && val <= BATCH_SIZE_MAX) {
                        setBatchConfig({ ...batchConfig, batchSize: val });
                      }
                    }}
                    className={cn(
                      'w-full px-3 py-1.5 text-sm rounded-md',
                      'bg-background border border-muted/30',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t('settings.ai_provider.batch_size_description')}
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
