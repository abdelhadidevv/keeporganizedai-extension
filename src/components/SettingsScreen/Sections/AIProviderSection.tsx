/* eslint-disable no-nested-ternary */
/* eslint-disable object-curly-newline */
import { Eye, EyeOff, Check, AlertCircle, Key, Server, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { Spinner, Select, ThemedIcon } from '@/components/ui';
import type { AIProvider } from '@/types';
import { set } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';
import { GEMINI_MODELS, CLAUDE_MODELS, OPENAI_MODELS } from '@/types/ai';

interface AIProviderSectionProps {
  isLoading: boolean;
}

const AI_PROVIDERS = [
  {
    value: 'gemini' as AIProvider,
    label: 'Google Gemini',
    icon: <img src="/gemini.svg" alt="Gemini" className="w-4 h-4" />,
    placeholder: 'Enter your Gemini API key',
  },
  {
    value: 'openai' as AIProvider,
    label: 'OpenAI',
    icon: <ThemedIcon light="/openai-black.svg" dark="/openai-white.svg" alt="OpenAI" />,
    placeholder: 'Enter your OpenAI API key',
  },
  {
    value: 'claude' as AIProvider,
    label: 'Anthropic Claude',
    icon: <img src="/claude.svg" alt="Claude" className="w-4 h-4" />,
    placeholder: 'Enter your Anthropic API key',
  },
  {
    value: 'ollama' as AIProvider,
    label: 'Ollama (Local)',
    icon: <Server className="w-4 h-4" />,
    placeholder: 'No API key needed',
  },
];

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
  const { aiProvider, setAIProvider, apiKeys, modelSelections, setApiKey, setModel, clearApiKey } =
    useSettings();

  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<{ name: string }[]>([]);
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);

  const selectedProvider = AI_PROVIDERS.find((p) => p.value === aiProvider) ?? AI_PROVIDERS[0];
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

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wider">AI Provider</h2>
      <div className="rounded-lg border border-muted/20 bg-card p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="block text-xs text-muted mb-2">Provider</span>
              <Select
                fullWidth
                value={aiProvider}
                onValueChange={handleProviderChange}
                options={AI_PROVIDERS}
              />
            </div>

            {models.length > 0 && (
              <div>
                <span className="block text-xs text-muted mb-2">Model</span>
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
                  <div className="flex items-center gap-2">
                    <Server className="w-3 h-3 text-muted" />
                    <span className="text-xs text-muted">Ollama Endpoint</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      onBlur={handleEndpointSave}
                      placeholder="http://localhost:11434"
                      className={cn(
                        'flex-1 px-3 py-1.5 text-sm rounded-md',
                        'bg-background border border-muted/30',
                        'placeholder:text-muted/50',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Model</span>
                    <button
                      type="button"
                      onClick={() => fetchOllamaModels(false)}
                      disabled={isLoadingOllamaModels}
                      className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw
                        className={cn('w-3 h-3', isLoadingOllamaModels && 'animate-spin')}
                      />
                      Refresh
                    </button>
                  </div>
                  {isLoadingOllamaModels ? (
                    <div className="flex items-center justify-center py-2">
                      <Spinner />
                    </div>
                  ) : ollamaError ? (
                    <div className="flex items-center gap-1 text-xs text-red-500">
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
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>No models found. Make sure Ollama is running.</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-muted" />
                  <span className="text-xs text-muted">API Key</span>
                  {apiKeys[aiProvider] && <Check className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onBlur={handleKeySave}
                    placeholder={selectedProvider.placeholder}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-sm rounded-md',
                      'bg-background border border-muted/30',
                      'placeholder:text-muted/50',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-md hover:bg-muted/10"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4 text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted" />
                    )}
                  </button>
                </div>
                {!hasApiKey && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>API key required for AI features</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
