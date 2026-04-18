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

export type GeminiModel = 'gemini-2.5-flash';
export type ClaudeModel = 'claude-3-5-haiku-20240307';
export type OpenAIModel = 'gpt-4o-mini';

export type AIModel = GeminiModel | ClaudeModel | OpenAIModel;

export interface AIApiKeys {
  gemini?: string;
  claude?: string;
  openai?: string;
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
