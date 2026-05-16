import type { TFunction } from 'i18next';
import { FolderOpen, SearchX, Layers } from 'lucide-react';
import type { ErrorStateProps } from '@/components/ErrorState/ErrorState';
import type { LoadingStateProps } from '@/components/LoadingState/LoadingState';
import type { EmptyStateProps } from '@/components/EmptyState/EmptyState';

//
// Error presets
//

const ERROR_PRESET_PATH: Record<string, string> = {
  loadBookmarks: 'error_state.load_bookmarks',
  saveFailed: 'error_state.save_failed',
  networkError: 'error_state.network_error',
  aiError: 'error_state.ai_error',
  missingApiKey: 'error_state.missing_api_key',
};

const NS = { ns: 'common' };

export function getErrorPresets(t: TFunction) {
  return {
    loadBookmarks: {
      title: t('error_state.load_bookmarks.title', NS),
      message: t('error_state.load_bookmarks.message', NS),
    },
    saveFailed: {
      title: t('error_state.save_failed.title', NS),
      message: t('error_state.save_failed.message', NS),
    },
    networkError: {
      title: t('error_state.network_error.title', NS),
      message: t('error_state.network_error.message', NS),
    },
    aiError: {
      title: t('error_state.ai_error.title', NS),
      message: t('error_state.ai_error.message', NS),
    },
    missingApiKey: {
      title: t('error_state.missing_api_key.title', NS),
      message: t('error_state.missing_api_key.message', NS),
    },
  } as const;
}

export type ErrorPresetKey = keyof ReturnType<typeof getErrorPresets>;

export function createErrorState(
  t: TFunction,
  presetKey: ErrorPresetKey,
  overrides?: Partial<Pick<ErrorStateProps, 'retryAction' | 'icon' | 'className'>>,
  interpolation?: Record<string, string | number>
): Pick<ErrorStateProps, 'title' | 'message'> {
  if (interpolation) {
    const path = ERROR_PRESET_PATH[presetKey as string] || presetKey;
    return {
      title: t(`${path}.title`, { ...interpolation, ...NS }),
      message: t(`${path}.message`, { ...interpolation, ...NS }),
      ...overrides,
    };
  }
  return {
    ...getErrorPresets(t)[presetKey],
    ...overrides,
  };
}

//
// Loading presets
//

export function getLoadingPresets(t: TFunction) {
  return {
    analyzingBookmarks: {
      message: t('loading_state.analyzing', NS),
      variant: 'dots' as const,
    },
    categorizing: {
      message: t('loading_state.categorizing', NS),
      variant: 'progress' as const,
      progress: 33,
    },
    organizing: {
      message: t('loading_state.organizing', NS),
      variant: 'progress' as const,
      progress: 66,
    },
    finalizing: {
      message: t('loading_state.finalizing', NS),
      variant: 'progress' as const,
      progress: 90,
    },
    loadingBookmarks: {
      message: t('loading_state.loading_bookmarks', NS),
      variant: 'spinner' as const,
    },
    processing: {
      message: t('loading_state.processing', NS),
      variant: 'dots' as const,
    },
  };
}

export type LoadingPresetKey = keyof ReturnType<typeof getLoadingPresets>;

export function createLoadingState(
  t: TFunction,
  presetKey: LoadingPresetKey,
  overrides?: Partial<Omit<LoadingStateProps, 'className'>>
): Omit<LoadingStateProps, 'className'> {
  return {
    ...getLoadingPresets(t)[presetKey],
    ...overrides,
  };
}

//
// Empty presets
//

export function getEmptyPresets(t: TFunction) {
  return {
    noBookmarks: {
      icon: <FolderOpen className="w-6 h-6" />,
      title: t('empty_state.no_bookmarks.title', NS),
      description: t('empty_state.no_bookmarks.description', NS),
    },
    noResults: {
      icon: <SearchX className="w-6 h-6" />,
      title: t('empty_state.no_results.title', NS),
      description: t('empty_state.no_results.description', NS),
    },
    emptyFolder: {
      icon: <FolderOpen className="w-6 h-6" />,
      title: t('empty_state.empty_folder.title', NS),
      description: t('empty_state.empty_folder.description', NS),
    },
    noCategories: {
      icon: <Layers className="w-6 h-6" />,
      title: t('empty_state.no_categories.title', NS),
      description: t('empty_state.no_categories.description', NS),
    },
  };
}

export type EmptyPresetKey = keyof ReturnType<typeof getEmptyPresets>;

export function createEmptyState(
  t: TFunction,
  presetKey: EmptyPresetKey,
  overrides?: Partial<EmptyStateProps>
): EmptyStateProps {
  const presets = getEmptyPresets(t);
  const preset = presets[presetKey];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetKey}`);
  }
  return { ...preset, ...overrides };
}
