import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FolderOpen, Layers, SearchX } from 'lucide-react';
import { EmptyState, EMPTY_STATE_PRESETS, createEmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Test Title" description="Test description" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <FolderOpen data-testid="custom-icon" className="w-6 h-6" />;
    render(<EmptyState title="Test" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders action button when provided, calls onClick', () => {
    const handleClick = vi.fn();
    render(<EmptyState title="Test" action={{ label: 'Click me', onClick: handleClick }} />);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('hides icon area when no icon provided', () => {
    const { container } = render(<EmptyState title="Test" />);
    const iconContainer = container.querySelector(
      '.rounded-full.bg-\\[var\\(--color-secondary\\)\\]\\/10'
    );
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Test" className="custom-class mt-4" />);
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement.classList.contains('custom-class')).toBe(true);
    expect(rootElement.classList.contains('mt-4')).toBe(true);
  });

  it('uses preset configs correctly', () => {
    expect(EMPTY_STATE_PRESETS.noBookmarks.title).toBe('No bookmarks yet');
    expect(EMPTY_STATE_PRESETS.noBookmarks.description).toBe(
      'Start adding bookmarks to organize them'
    );
    expect(EMPTY_STATE_PRESETS.noBookmarks.icon).toBeTruthy();

    expect(EMPTY_STATE_PRESETS.noResults.title).toBe('No results found');
    expect(EMPTY_STATE_PRESETS.noResults.icon).toBeTruthy();

    expect(EMPTY_STATE_PRESETS.emptyFolder.title).toBe('This folder is empty');
    expect(EMPTY_STATE_PRESETS.emptyFolder.description).toBe('Drag bookmarks here or add new ones');

    expect(EMPTY_STATE_PRESETS.noCategories.title).toBe('No categories defined');
    expect(EMPTY_STATE_PRESETS.noCategories.description).toBe(
      'Create your first category to get started'
    );
  });

  it('merge behavior (preset + custom props)', () => {
    const state = createEmptyState('noBookmarks', {
      description: 'Custom description',
    });
    expect(state.title).toBe('No bookmarks yet');
    expect(state.description).toBe('Custom description');
    expect(state.icon).toBeTruthy();

    const stateWithCustomIcon = createEmptyState('noResults', {
      icon: <Layers data-testid="custom" />,
    });
    expect(stateWithCustomIcon.icon).toBeTruthy();

    const stateWithAction = createEmptyState('emptyFolder', {
      action: { label: 'Add Bookmark', onClick: vi.fn() },
    });
    expect(stateWithAction.action).toBeTruthy();
    expect(stateWithAction.action?.label).toBe('Add Bookmark');
  });

  it('icon container styling', () => {
    const icon = <SearchX data-testid="test-icon" className="w-6 h-6" />;
    const { container } = render(<EmptyState title="Test" icon={icon} />);
    const iconWrapper = container.querySelector(
      '.rounded-full.bg-\\[var\\(--color-secondary\\)\\]\\/10'
    );
    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper?.querySelector('[data-testid="test-icon"]')).toBeInTheDocument();
    expect(iconWrapper?.classList.contains('p-3')).toBe(true);
    expect(iconWrapper?.classList.contains('mb-3')).toBe(true);
  });

  it('renders without description', () => {
    const { container } = render(<EmptyState title="Only Title" />);
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders without action button', () => {
    render(<EmptyState title="No Action" description="No button" />);
    expect(screen.getByText('No Action')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has animate-in fade-in class', () => {
    const { container } = render(<EmptyState title="Animated" />);
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement.classList.contains('animate-in')).toBe(true);
    expect(rootElement.classList.contains('fade-in')).toBe(true);
  });
});
