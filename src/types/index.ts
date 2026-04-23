export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children?: BookmarkNode[];
  dateAdded?: number;
  dateGroupModified?: number;
  index?: number;
}

export interface FolderNode extends Omit<BookmarkNode, 'url'> {
  url?: never;
  children?: BookmarkNode[];
}

export type LockType = 'none' | 'hard' | 'smart';

export interface LockState {
  folderId: string;
  lockType: LockType;
}

export type CategorySource = 'user' | 'ai' | 'default';

export interface Category {
  id: string;
  name: string;
  isLocked: boolean;
  source: CategorySource;
}

export interface BookmarkAssignment {
  bookmarkId: string;
  categoryId: string;
}

export interface WizardState {
  currentStep: number;
  selectedFolderId: string | null;
  categories: Category[];
  assignments: BookmarkAssignment[];
  isProcessing: boolean;
  error: string | null;
  lockStates: Record<string, LockType>;
}

export type AIProvider = 'gemini' | 'claude' | 'openai' | 'ollama';

export interface BackupData {
  version: string;
  createdAt: string;
  bookmarkTree: BookmarkNode[];
}

export interface WizardStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
}

export { STORAGE_KEYS, type StorageKey } from '@/services/storage-keys';
