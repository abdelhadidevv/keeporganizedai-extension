import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { LoadingState } from './LoadingState';
import { getLoadingPresets, createLoadingState } from '@/states/presets';

const t = i18n.getFixedT('en', 'common');

describe('getLoadingPresets', () => {
  it('has analyzingBookmarks preset with dots variant', () => {
    const presets = getLoadingPresets(t);
    expect(presets.analyzingBookmarks.variant).toBe('dots');
    expect(presets.analyzingBookmarks.message).toBe('Analyzing your bookmarks...');
  });

  it('has categorizing preset with progress at 33', () => {
    const presets = getLoadingPresets(t);
    expect(presets.categorizing.variant).toBe('progress');
    expect(presets.categorizing.progress).toBe(33);
  });

  it('has organizing preset with progress at 66', () => {
    const presets = getLoadingPresets(t);
    expect(presets.organizing.variant).toBe('progress');
    expect(presets.organizing.progress).toBe(66);
  });

  it('has finalizing preset with progress at 90', () => {
    const presets = getLoadingPresets(t);
    expect(presets.finalizing.variant).toBe('progress');
    expect(presets.finalizing.progress).toBe(90);
  });

  it('has loadingBookmarks preset with spinner variant', () => {
    const presets = getLoadingPresets(t);
    expect(presets.loadingBookmarks.variant).toBe('spinner');
  });

  it('has processing preset with dots variant', () => {
    const presets = getLoadingPresets(t);
    expect(presets.processing.variant).toBe('dots');
  });
});

describe('LoadingState', () => {
  it('renders spinner variant with message', () => {
    render(<LoadingState message="Loading data..." variant="spinner" />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(document.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('renders progress variant with correct percentage', () => {
    render(<LoadingState message="Uploading..." variant="progress" progress={50} />);
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('50');
  });

  it('renders dots variant with animation elements', () => {
    render(<LoadingState message="Please wait..." variant="dots" />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
    const dots = document.querySelectorAll('span.h-2.w-2.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('shows default message when not provided', () => {
    render(<LoadingState variant="spinner" />);
    expect(screen.getByText('Loading bookmarks...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingState className="custom-class" variant="spinner" />);
    const container = document.querySelector('[role="status"]');
    expect(container?.classList.contains('custom-class')).toBe(true);
  });

  it('uses preset configs correctly', () => {
    const state = createLoadingState(t, 'analyzingBookmarks');
    expect(state.message).toBe('Analyzing your bookmarks...');
    expect(state.variant).toBe('dots');
  });

  it('dots animation renders 3 dot elements', () => {
    render(<LoadingState variant="dots" />);
    const dots = document.querySelectorAll('span.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('progress clamped between 0-100', () => {
    const { rerender } = render(<LoadingState variant="progress" progress={-10} />);
    let progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('0');

    rerender(<LoadingState variant="progress" progress={150} />);
    progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('renders with all preset types', () => {
    const presetKeys = [
      'analyzingBookmarks',
      'categorizing',
      'organizing',
      'finalizing',
      'loadingBookmarks',
      'processing',
    ] as const;

    presetKeys.forEach((key) => {
      const state = createLoadingState(t, key);
      expect(state.message).toBeTruthy();
      expect(['spinner', 'progress', 'dots']).toContain(state.variant);
    });
  });

  it('createLoadingState merges overrides with preset', () => {
    const state = createLoadingState(t, 'categorizing', { message: 'Custom message' });
    expect(state.message).toBe('Custom message');
    expect(state.variant).toBe('progress');
  });

  it('has correct ARIA attributes', () => {
    render(<LoadingState message="Test message" variant="spinner" />);
    const status = document.querySelector('[role="status"][aria-live="polite"]');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
