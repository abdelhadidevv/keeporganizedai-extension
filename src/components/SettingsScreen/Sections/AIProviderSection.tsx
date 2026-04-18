/* eslint-disable object-curly-newline */
import { Eye, EyeOff, Check, AlertCircle, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { Spinner, Select, ThemedIcon } from '@/components/ui';
import type { AIProvider } from '@/types';

interface AIProviderSectionProps {
  isLoading: boolean;
}

const AI_PROVIDERS = [
  {
    value: 'gemini' as AIProvider,
    label: 'gemini-2.5-flash',
    icon: <img src="/gemini.svg" alt="Gemini" className="w-4 h-4" />,
    placeholder: 'Enter your Gemini API key',
  },
  {
    value: 'openai' as AIProvider,
    label: 'gpt-4o-mini',
    icon: <ThemedIcon light="/openai-black.svg" dark="/openai-white.svg" alt="OpenAI" />,
    placeholder: 'Enter your OpenAI API key',
  },
];

export function AIProviderSection({ isLoading }: AIProviderSectionProps) {
  const { aiProvider, setAIProvider, apiKeys, setApiKey, clearApiKey } = useSettings();

  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const selectedProvider = AI_PROVIDERS.find((p) => p.value === aiProvider) ?? AI_PROVIDERS[0];

  useEffect(() => {
    setKeyInput(apiKeys[aiProvider] || '');
  }, [apiKeys, aiProvider]);

  const handleProviderChange = async (value: string) => {
    await setAIProvider(value as AIProvider);
  };

  const handleKeySave = async () => {
    if (keyInput.trim()) {
      await setApiKey(aiProvider, keyInput.trim());
    } else {
      await clearApiKey(aiProvider);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-[var(--color-secondary)] uppercase tracking-wider">
        AI Provider
      </h2>
      <div className="rounded-lg border border-[var(--color-secondary)]/20 bg-card p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="block text-xs text-[var(--color-secondary)] mb-2">Provider</span>
              <Select
                fullWidth
                value={aiProvider}
                onValueChange={handleProviderChange}
                options={AI_PROVIDERS}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-3 h-3 text-[var(--color-secondary)]" />
                <span className="text-xs text-[var(--color-secondary)]">API Key</span>
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
                    'bg-background border border-[var(--color-secondary)]/30',
                    'placeholder:text-[var(--color-secondary)]/50',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded-md hover:bg-[var(--color-secondary)]/10"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4 text-[var(--color-secondary)]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[var(--color-secondary)]" />
                  )}
                </button>
              </div>
              {!apiKeys[aiProvider] && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>API key required for AI features</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
