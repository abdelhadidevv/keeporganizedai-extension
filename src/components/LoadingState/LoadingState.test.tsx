import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState, LOADING_PRESETS, createLoadingState } from './LoadingState';

describe('LOADING_PRESETS', () => {
  it('has analyzingBookmarks preset with dots variant', () => {
    expect(LOADING_PRESETS.analyzingBookmarks.variant).toBe('dots');
    expect(LOADING_PRESETS.analyzingBookmarks.message).toBe('Analyzing your bookmarks...');
  });

  it('has categorizing preset with progress at 33', () => {
    expect(LOADING_PRESETS.categorizing.variant).toBe('progress');
    expect(LOADING_PRESETS.categorizing.progress).toBe(33);
  });

  it('has organizing preset with progress at 66', () => {
    expect(LOADING_PRESETS.organizing.variant).toBe('progress');
    expect(LOADING_PRESETS.organizing.progress).toBe(66);
  });

  it('has finalizing preset with progress at 90', () => {
    expect(LOADING_PRESETS.finalizing.variant).toBe('progress');
    expect(LOADING_PRESETS.finalizing.progress).toBe(90);
  });

  it('has loadingBookmarks preset with spinner variant', () => {
    expect(LOADING_PRESETS.loadingBookmarks.variant).toBe('spinner');
  });

  it('has processing preset with dots variant', () => {
    expect(LOADING_PRESETS.processing.variant).toBe('dots');
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

  it('hides message when not provided', () => {
    const { container } = render(<LoadingState variant="spinner" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingState className="custom-class" variant="spinner" />);
    const container = document.querySelector('[role="status"]');
    expect(container?.classList.contains('custom-class')).toBe(true);
  });

  it('uses preset configs correctly', () => {
    const state = createLoadingState('analyzingBookmarks');
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
      const state = createLoadingState(key);
      expect(state.message).toBeTruthy();
      expect(['spinner', 'progress', 'dots']).toContain(state.variant);
    });
  });

  it('createLoadingState merges overrides with preset', () => {
    const state = createLoadingState('categorizing', { message: 'Custom message' });
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
