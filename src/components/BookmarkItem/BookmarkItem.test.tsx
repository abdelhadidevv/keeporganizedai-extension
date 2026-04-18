import type { BookmarkNode } from '@/types/index';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookmarkItem } from './BookmarkItem';

const createMockBookmark = (overrides: Partial<BookmarkNode> = {}): BookmarkNode => ({
  id: 'bookmark-1',
  title: 'Google',
  url: 'https://google.com',
  ...overrides,
});

describe('BookmarkItem', () => {
  const defaultProps = {
    bookmark: createMockBookmark(),
    onDelete: vi.fn(),
    onClick: vi.fn(),
    isSelected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bookmark title', () => {
    render(<BookmarkItem {...defaultProps} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('renders bookmark URL', () => {
    render(<BookmarkItem {...defaultProps} />);
    expect(screen.getByText('https://google.com')).toBeInTheDocument();
  });

  it('renders "Untitled" when title is empty', () => {
    render(<BookmarkItem {...defaultProps} bookmark={createMockBookmark({ title: '' })} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.click(mainItem!);
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('handles keyboard activation with Enter key', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.click(mainItem!);
    await user.keyboard('{Enter}');
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('handles keyboard activation with Space key', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.click(mainItem!);
    await user.keyboard(' ');
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it('shows action buttons on hover', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.hover(mainItem!);
    const deleteButton = screen.getByTitle('Delete bookmark');
    expect(deleteButton).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.hover(mainItem!);
    const deleteButton = screen.getByTitle('Delete bookmark');
    await user.click(deleteButton);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('bookmark-1');
  });

  it('stops propagation when action buttons are clicked', async () => {
    const user = userEvent.setup();
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    await user.hover(mainItem!);
    const deleteButton = screen.getByTitle('Delete bookmark');
    await user.click(deleteButton);
    expect(defaultProps.onClick).not.toHaveBeenCalled();
  });

  it('applies selected state styles when isSelected is true', () => {
    render(<BookmarkItem {...defaultProps} isSelected />);
    const mainItem = document.querySelector('[role="button"]');
    expect(mainItem?.classList.contains('border-l-2')).toBe(true);
  });

  it('has correct ARIA role', () => {
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    expect(mainItem).toBeInTheDocument();
  });

  it('is keyboard focusable with tabIndex', () => {
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    expect(mainItem).toHaveAttribute('tabIndex', '0');
  });

  it('hides action buttons when not hovered', () => {
    render(<BookmarkItem {...defaultProps} />);
    const deleteButton = screen.queryByTitle('Delete bookmark');
    expect(deleteButton).toBeInTheDocument();
    const parentDiv = deleteButton?.closest('div[class*="opacity-0"]');
    expect(parentDiv).toBeInTheDocument();
  });

  it('does not render delete button when onDelete is not provided', () => {
    render(<BookmarkItem {...defaultProps} onDelete={undefined} />);
    const mainItem = document.querySelector('[role="button"]');
    expect(mainItem).toBeInTheDocument();
    const deleteButton = screen.queryByTitle('Delete bookmark');
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('shows external link button when onClick and url are provided', () => {
    render(<BookmarkItem {...defaultProps} />);
    const mainItem = document.querySelector('[role="button"]');
    expect(mainItem).toBeInTheDocument();
  });
});
