/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { FolderOpen, SearchX, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export interface EmptyStatePreset {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const EMPTY_STATE_PRESETS: Record<string, EmptyStatePreset> = {
  noBookmarks: {
    icon: <FolderOpen className="w-6 h-6" />,
    title: 'No bookmarks yet',
    description: 'Start adding bookmarks to organize them',
  },
  noResults: {
    icon: <SearchX className="w-6 h-6" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters',
  },
  emptyFolder: {
    icon: <FolderOpen className="w-6 h-6" />,
    title: 'This folder is empty',
    description: 'Drag bookmarks here or add new ones',
  },
  noCategories: {
    icon: <Layers className="w-6 h-6" />,
    title: 'No categories defined',
    description: 'Create your first category to get started',
  },
};

export function createEmptyState(
  presetKey: string,
  overrides?: Partial<EmptyStateProps>
): EmptyStateProps {
  const preset = EMPTY_STATE_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetKey}`);
  }
  return { ...preset, ...overrides };
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 animate-in fade-in',
        className
      )}
    >
      {icon && (
        <div className="rounded-full bg-[var(--color-secondary)]/10 p-3 mb-3">
          <div className="text-[var(--color-secondary)] w-6 h-6">{icon}</div>
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
}
