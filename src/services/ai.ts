import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

import { AIError } from '@/types/ai';
// import { DEFAULT_MAX_CATEGORIES } from '@/types/ai';
import { BookmarkNode, Category, AIProvider, BookmarkAssignment } from '@/types';
import { get } from '@/services/storage';
import { STORAGE_KEYS } from '@/services/storage-keys';
import { SYSTEM_PROMPT_CATEGORIES, SYSTEM_PROMPT_ASSIGNMENTS } from '@/prompts/ai-prompts';

const categoriesResponseSchema = z.object({
  categories: z.array(z.string()).describe('List of category names'),
});

const assignmentSchema = z.object({
  bookmarkId: z.string().describe('The ID of the bookmark to assign'),
  categoryId: z.string().describe('The ID of the target category'),
});

const assignmentsResponseSchema = z.object({
  assignments: z.array(assignmentSchema).describe('List of bookmark to category assignments'),
});

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

async function getApiKey(provider: AIProvider): Promise<string | undefined> {
  const apiKeys = await get<Record<AIProvider, string>>(STORAGE_KEYS.API_KEYS);
  return apiKeys?.[provider];
}

function createModel(provider: AIProvider, apiKey: string) {
  switch (provider) {
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey })('gemini-2.5-flash');
    case 'claude':
      return createAnthropic({ apiKey })('claude-3-5-haiku-20240307');
    case 'openai':
      return createOpenAI({ apiKey })('gpt-4o-mini');
    default:
      return createGoogleGenerativeAI({ apiKey })('gemini-2.5-flash');
  }
}

function formatBookmarks(bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[]): string {
  return bookmarks.map((b) => `${b.title} (${b.url || 'no URL'})`).join('\n');
}

function createAiError(
  code: string,
  message: string,
  provider: AIProvider,
  retryable: boolean
): never {
  // eslint-disable-next-line no-throw-literal
  throw {
    code,
    message,
    provider,
    retryable,
  } as AIError;
}

async function getApiKeyOrThrow(provider: AIProvider): Promise<string> {
  const apiKey = await getApiKey(provider);
  if (!apiKey) {
    createAiError(
      'MISSING_API_KEY',
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
    createAiError('EMPTY_BOOKMARKS', message, provider, false);
  }
}

function validateCategories(categories: Category[], provider: AIProvider): void {
  if (!categories || categories.length === 0) {
    createAiError('EMPTY_CATEGORIES', 'No categories provided for assignment', provider, false);
  }
}

const MAX_BOOKMARKS_PER_REQUEST = 130;

// function buildSmartLockedFoldersPrompt(folders: string[]): string {
//   if (folders.length === 0) return '';
//   return `\n\nSmartCategories:\n[${folders.join(', ')}]`;
// }

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

  return [...smartLocked, ...unlocked]; //.slice(0, DEFAULT_MAX_CATEGORIES);
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

const aiService: AIService = {
  async generateCategories(
    bookmarks: Pick<BookmarkNode, 'id' | 'title' | 'url'>[],
    smartLockedFolders: string[],
    provider: AIProvider = 'gemini'
  ): Promise<Category[]> {
    const apiKey = await getApiKeyOrThrow(provider);
    validateBookmarks(bookmarks, 'categorization', provider);

    try {
      const existingCategories =
        smartLockedFolders.length > 0
          ? smartLockedFolders.map((c, i) => `${i + 1}. "${c}"`).join('\n')
          : 'None yet.';

      const model = createModel(provider, apiKey);
      const systemPrompt = SYSTEM_PROMPT_CATEGORIES.replace(
        '{existingCategories}',
        existingCategories
      );
      const bookmarkList = formatBookmarks(bookmarks.slice(0, MAX_BOOKMARKS_PER_REQUEST));

      const { object } = await generateObject({
        model,
        schema: categoriesResponseSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: bookmarkList },
        ],
      });

      return transformToCategories(object.categories, provider, smartLockedFolders);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      createAiError(
        'CATEGORY_GENERATION_FAILED',
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
    const apiKey = await getApiKeyOrThrow(provider);
    validateBookmarks(bookmarks, 'assignment', provider);
    validateCategories(categories, provider);

    try {
      const model = createModel(provider, apiKey);
      const prompt = buildAssignmentPrompt(categories, bookmarks);

      const { object } = await generateObject({
        model,
        schema: assignmentsResponseSchema,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ASSIGNMENTS },
          { role: 'user', content: prompt },
        ],
      });

      return processAssignments(object.assignments, bookmarks, categories);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }
      createAiError(
        'ASSIGNMENT_FAILED',
        error instanceof Error ? error.message : 'Failed to assign bookmarks',
        provider,
        true
      );
    }
  },

  async hasApiKey(provider: AIProvider): Promise<boolean> {
    const apiKey = await getApiKey(provider);
    return !!apiKey;
  },
};

export { aiService };
export type { AIService };
