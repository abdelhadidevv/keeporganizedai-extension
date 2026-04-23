import { BookmarkNode, Category, BookmarkAssignment, AIProvider } from '@/types/index';

export interface AICategoryRequest {
  provider: AIProvider;
  bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[];
  existingCategories: Category[];
  folderContext: string;
  maxCategories?: number;
}

export interface AICategoryResponse {
  categories: Category[];
  assignments: BookmarkAssignment[];
  confidence: number;
  reasoning?: string;
}

export interface AIAssignmentRequest {
  provider: AIProvider;
  bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[];
  targetCategoryId: string;
  reason?: string;
}

export interface AIAssignmentResponse {
  assignments: BookmarkAssignment[];
  success: boolean;
  message?: string;
}

export interface AIError {
  code: string;
  message: string;
  provider?: AIProvider;
  retryable: boolean;
}

export const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' },
  { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
] as const;

export const CLAUDE_MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
] as const;

export const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
  { value: 'gpt-5.4', label: 'GPT-5.4' },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]['value'];
export type ClaudeModel = (typeof CLAUDE_MODELS)[number]['value'];
export type OpenAIModel = (typeof OPENAI_MODELS)[number]['value'];

export type AIModel = GeminiModel | ClaudeModel | OpenAIModel;

export interface AIApiKeys {
  gemini?: string;
  claude?: string;
  openai?: string;
  geminiModel?: string;
  claudeModel?: string;
  openaiModel?: string;
  ollamaEndpoint?: string;
  ollamaModel?: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: AIModel;
  temperature?: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'gemini',
  temperature: 0.3,
};

export const DEFAULT_MAX_CATEGORIES = 10;

export const DEFAULT_MODEL: Record<Exclude<AIProvider, 'ollama'>, string> = {
  gemini: 'gemini-2.5-flash',
  claude: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
};
