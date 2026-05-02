import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

import { DEFAULT_MODEL } from '@/types/ai';
import { BookmarkNode, Category, AIProvider, BookmarkAssignment } from '@/types';
import { get, getSync } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';
import { SYSTEM_PROMPT_CATEGORIES, SYSTEM_PROMPT_ASSIGNMENTS } from '@/prompts/ai-prompts';

interface AIService {
  generateCategories: (
    bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
    smartLockedFolders: string[],
    provider?: AIProvider
  ) => Promise<Category[]>;
  assignBookmarks: (
    bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
    categories: Category[],
    provider?: AIProvider
  ) => Promise<BookmarkAssignment[]>;
  hasApiKey: (provider: AIProvider) => Promise<boolean>;
}

interface ModelSelections {
  gemini: string;
  claude: string;
  openai: string;
  ollama: string;
}

interface OllamaConfig {
  endpoint: string;
  model: string;
}

const ERROR_CODES = {
  MISSING_API_KEY: 'MISSING_API_KEY',
  EMPTY_BOOKMARKS: 'EMPTY_BOOKMARKS',
  EMPTY_CATEGORIES: 'EMPTY_CATEGORIES',
  CATEGORY_GENERATION_FAILED: 'CATEGORY_GENERATION_FAILED',
  ASSIGNMENT_FAILED: 'ASSIGNMENT_FAILED',
  NO_OLLAMA_MODEL: 'NO_OLLAMA_MODEL',
  UNKNOWN_PROVIDER: 'UNKNOWN_PROVIDER',
} as const;

const MAX_BOOKMARKS_PER_REQUEST = 130;
const OLLAMA_DEFAULT_ENDPOINT = 'http://localhost:11434';

async function getApiKey(provider: AIProvider): Promise<string | undefined> {
  const apiKeys = await get<Record<AIProvider, string>>(STORAGE_KEYS.API_KEYS);
  return apiKeys?.[provider];
}

async function getOllamaConfig(): Promise<OllamaConfig> {
  const apiKeys = await get<Record<string, string>>(STORAGE_KEYS.API_KEYS);
  const modelSelections = await getSync<ModelSelections>(STORAGE_KEYS.MODEL_SELECTIONS);
  return {
    endpoint: apiKeys?.ollamaEndpoint || OLLAMA_DEFAULT_ENDPOINT,
    model: modelSelections?.ollama || '',
  };
}

async function getModel(provider: AIProvider): Promise<string> {
  const modelSelections = await getSync<ModelSelections>(STORAGE_KEYS.MODEL_SELECTIONS);
  if (modelSelections?.[provider]) {
    return modelSelections[provider];
  }
  if (provider === 'ollama') {
    return '';
  }
  return DEFAULT_MODEL[provider] || '';
}

function createAiError(
  code: string,
  message: string,
  provider: AIProvider,
  retryable: boolean
): never {
  throw new Error(
    JSON.stringify({
      code,
      message,
      provider,
      retryable,
    })
  );
}

async function getApiKeyOrThrow(provider: AIProvider): Promise<string> {
  if (provider === 'ollama') {
    return '';
  }
  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    createAiError(
      ERROR_CODES.MISSING_API_KEY,
      `No API key configured for ${provider}. Please add your API key in Settings.`,
      provider,
      false
    );
  }
  return apiKey;
}

function validateBookmarks(
  bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
  operation: 'categorization' | 'assignment',
  provider: AIProvider
): void {
  if (!bookmarks || bookmarks.length === 0) {
    const message =
      operation === 'categorization'
        ? 'No bookmarks provided for categorization'
        : 'No bookmarks provided for assignment';
    createAiError(ERROR_CODES.EMPTY_BOOKMARKS, message, provider, false);
  }
}

function validateCategories(categories: Category[], provider: AIProvider): void {
  if (!categories || categories.length === 0) {
    createAiError(
      ERROR_CODES.EMPTY_CATEGORIES,
      'No categories provided for assignment',
      provider,
      false
    );
  }
}

function transformToCategories(
  categoryNames: string[],
  provider: AIProvider,
  smartLockedFolders: string[]
): Category[] {
  const unlocked = categoryNames.map((name, index) => ({
    id: `ai-${provider}-${index + 1}`,
    name,
    isLocked: false,
    source: 'ai' as const,
  }));

  const smartLocked = smartLockedFolders.map((name, index) => ({
    id: `locked-${index + 1}`,
    name,
    isLocked: true,
    source: 'user' as const,
  }));

  return [...smartLocked, ...unlocked];
}

function formatBookmarks(bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[]): string {
  return bookmarks.map((b) => `${b.title} (${b.url || 'no URL'})`).join('\n');
}

function formatBookmarksWithIds(bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[]): string {
  return bookmarks
    .slice(0, MAX_BOOKMARKS_PER_REQUEST)
    .map((b) => `[${b.id}] ${b.title} (${b.url || 'no URL'})`)
    .join('\n');
}

function buildCategoryListPrompt(categories: Category[]): string {
  return categories.map((c) => `[${c.id}] "${c.name}"${c.isLocked ? ' (locked)' : ''}`).join('\n');
}

function buildAssignmentPrompt(
  categories: Category[],
  bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[]
): string {
  const categoryList = buildCategoryListPrompt(categories);
  const bookmarkList = formatBookmarksWithIds(bookmarks);
  return `CATEGORIES:${categoryList}\nBOOKMARKS:${bookmarkList}`;
}

function processAssignments(
  assignments: { bookmarkId: string; categoryId: string }[],
  bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
  categories: Category[]
): BookmarkAssignment[] {
  const validBookmarkIds = new Set(bookmarks.map((b) => b.id));
  const validCategoryIds = new Set(categories.map((c) => c.id));

  const validAssignments = assignments.filter(
    (a) => validBookmarkIds.has(a.bookmarkId) && validCategoryIds.has(a.categoryId)
  );

  const assignedIds = new Set(validAssignments.map((a) => a.bookmarkId));
  const defaultCategory = categories.find((c) => !c.isLocked);

  if (!defaultCategory) return validAssignments;

  const unassignedBookmarks = bookmarks.filter((b) => !assignedIds.has(b.id));
  const fallbackAssignments = unassignedBookmarks.map((b) => ({
    bookmarkId: b.id,
    categoryId: defaultCategory.id,
  }));

  return [...validAssignments, ...fallbackAssignments];
}

function parseJsonResponse<T>(text: string): T {
  let jsonText = text.trim();
  jsonText = jsonText.replace(/^```json\s*/i, '').replace(/```$/i, '');
  jsonText = jsonText.replace(/^```\s*/, '').replace(/```$/i, '');
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }
  return JSON.parse(jsonMatch[0]) as T;
}

async function callProvider(
  provider: AIProvider,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const isOllama = provider === 'ollama';

  if (isOllama) {
    const config = await getOllamaConfig();
    if (!config.model) {
      createAiError(
        ERROR_CODES.NO_OLLAMA_MODEL,
        'No Ollama model selected. Please select a model in Settings.',
        provider,
        false
      );
    }
    const response = await fetch(`${config.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const content = data.message?.content;
    if (!content) {
      throw new Error('No response from Ollama');
    }
    return content;
  }

  const apiKey = await getApiKeyOrThrow(provider);
  const model = await getModel(provider);

  switch (provider) {
    case 'gemini': {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({ model });
      const result = await geminiModel.generateContent([{ text: systemPrompt }, { text: prompt }]);
      return result.response.text();
    }
    case 'claude': {
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      const message = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }
      return content.text;
    }
    case 'openai': {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });
      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }
      return choice.message.content || '';
    }
    default:
      createAiError(ERROR_CODES.UNKNOWN_PROVIDER, `Unknown provider: ${provider}`, provider, false);
      return '';
  }
}

const aiService: AIService = {
  async generateCategories(
    bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
    smartLockedFolders: string[],
    provider: AIProvider = 'gemini'
  ): Promise<Category[]> {
    await getApiKeyOrThrow(provider);
    validateBookmarks(bookmarks, 'categorization', provider);

    try {
      const existingCategories =
        smartLockedFolders.length > 0
          ? smartLockedFolders.map((c, i) => `${i + 1}. "${c}"`).join('\n')
          : 'None yet.';

      const systemPrompt = SYSTEM_PROMPT_CATEGORIES.replace(
        '{existingCategories}',
        existingCategories
      );
      const bookmarkList = formatBookmarks(bookmarks.slice(0, MAX_BOOKMARKS_PER_REQUEST));
      const responseText = await callProvider(provider, bookmarkList, systemPrompt);

      const parsed = parseJsonResponse<{ categories: string[] }>(responseText);
      return transformToCategories(parsed.categories || [], provider, smartLockedFolders);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      createAiError(
        ERROR_CODES.CATEGORY_GENERATION_FAILED,
        error instanceof Error ? error.message : 'Failed to generate categories',
        provider,
        true
      );
    }
  },

  async assignBookmarks(
    bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
    categories: Category[],
    provider: AIProvider = 'gemini'
  ): Promise<BookmarkAssignment[]> {
    await getApiKeyOrThrow(provider);
    validateBookmarks(bookmarks, 'assignment', provider);
    validateCategories(categories, provider);

    try {
      const prompt = buildAssignmentPrompt(categories, bookmarks);
      const responseText = await callProvider(provider, prompt, SYSTEM_PROMPT_ASSIGNMENTS);

      const parsed = parseJsonResponse<{
        assignments: { bookmarkId: string; categoryId: string }[];
      }>(responseText);
      const rawAssignments = parsed.assignments || [];
      return processAssignments(rawAssignments, bookmarks, categories);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      createAiError(
        ERROR_CODES.ASSIGNMENT_FAILED,
        error instanceof Error ? error.message : 'Failed to assign bookmarks',
        provider,
        true
      );
    }
  },

  async hasApiKey(provider: AIProvider): Promise<boolean> {
    if (provider === 'ollama') {
      const config = await getOllamaConfig();
      return !!config.model;
    }
    const apiKey = await getApiKey(provider);
    return !!apiKey;
  },
};

export { aiService };
export type { AIService };
