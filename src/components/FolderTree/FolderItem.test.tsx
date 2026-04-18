import type { BookmarkNode } from '@/types/index';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderItem } from './FolderItem';

const createMockFolder = (overrides: Partial<BookmarkNode> = {}): BookmarkNode => ({
  id: 'folder-1',
  title: 'Test Folder',
  children: [],
  ...overrides,
});

describe('FolderItem', () => {
  const defaultProps = {
    folder: createMockFolder({ id: 'folder-1', title: 'Work' }),
    depth: 0,
    index: 0,
    isExpanded: false,
    isSelected: false,
    isLocked: false,
    lockType: 'none' as const,
    onToggle: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders folder title', () => {
    render(<FolderItem {...defaultProps} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('renders chevron SVG when folder has children', () => {
    const folderWithChildren = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [createMockFolder({ id: 'subfolder-1', title: 'Subfolder' })],
    });
    render(<FolderItem {...defaultProps} folder={folderWithChildren} />);
    const chevron = document.querySelector('.lucide-chevron-right');
    expect(chevron).toBeInTheDocument();
  });

  it('hides chevron when folder has no children', () => {
    render(<FolderItem {...defaultProps} />);
    const chevronWrapper = document.querySelector('[class*="invisible"]');
    expect(chevronWrapper).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...defaultProps} />);
    await user.click(screen.getByRole('treeitem'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
  });

  it('calls onToggle when clicked and has children', async () => {
    const user = userEvent.setup();
    const folderWithChildren = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [createMockFolder({ id: 'subfolder-1', title: 'Subfolder' })],
    });
    render(<FolderItem {...defaultProps} folder={folderWithChildren} />);
    await user.click(screen.getByRole('treeitem'));
    expect(defaultProps.onToggle).toHaveBeenCalledWith('folder-1');
  });

  it('does not call onToggle when clicked and has no children', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...defaultProps} />);
    await user.click(screen.getByRole('treeitem'));
    expect(defaultProps.onToggle).not.toHaveBeenCalled();
  });

  it('handles keyboard activation with Enter key', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...defaultProps} />);
    const item = screen.getByRole('treeitem');
    await user.click(item);
    await user.keyboard('{Enter}');
    expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
  });

  it('handles keyboard activation with Space key', async () => {
    const user = userEvent.setup();
    render(<FolderItem {...defaultProps} />);
    const item = screen.getByRole('treeitem');
    await user.click(item);
    await user.keyboard(' ');
    expect(defaultProps.onSelect).toHaveBeenCalledWith('folder-1');
  });

  it('applies selected state styles when isSelected is true', () => {
    render(<FolderItem {...defaultProps} isSelected={true} />);
    const item = screen.getByRole('treeitem');
    expect(item).toHaveAttribute('aria-selected', 'true');
  });

  it('displays bookmark count when folder has bookmark children', () => {
    const folderWithBookmarks = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [
        { id: 'bookmark-1', title: 'Google', url: 'https://google.com' },
        { id: 'bookmark-2', title: 'GitHub', url: 'https://github.com' },
      ],
    });
    render(<FolderItem {...defaultProps} folder={folderWithBookmarks} />);
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('counts bookmarks recursively in nested folders', () => {
    const nestedFolder = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [
        {
          id: 'subfolder-1',
          title: 'Projects',
          children: [
            { id: 'bookmark-1', title: 'Project A', url: 'https://example.com/a' },
            { id: 'bookmark-2', title: 'Project B', url: 'https://example.com/b' },
          ],
        },
        { id: 'bookmark-3', title: 'Work Site', url: 'https://work.com' },
      ],
    });
    render(<FolderItem {...defaultProps} folder={nestedFolder} isExpanded={true} />);
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('shows lock badge for hard-locked folders', () => {
    render(<FolderItem {...defaultProps} isLocked={true} lockType="hard" />);
    const lockIcon = document.querySelector('.lucide-lock');
    expect(lockIcon).toBeInTheDocument();
    const badge = lockIcon?.closest('[class*="inline-flex"]');
    expect(badge).toBeInTheDocument();
  });

  it('shows lock badge for smart-locked folders', () => {
    render(<FolderItem {...defaultProps} isLocked={true} lockType="smart" />);
    const lockIcon = document.querySelector('.lucide-lock');
    expect(lockIcon).toBeInTheDocument();
  });

  it('does not show lock badge when isLocked is false', () => {
    render(<FolderItem {...defaultProps} isLocked={false} lockType="none" />);
    const lockIcon = document.querySelector('.lucide-lock');
    expect(lockIcon).not.toBeInTheDocument();
  });

  it('applies depth indentation via CSS variable', () => {
    const { rerender } = render(<FolderItem {...defaultProps} depth={0} />);
    let item = screen.getByRole('treeitem');
    expect(item.style.getPropertyValue('--depth')).toBe('0');

    rerender(<FolderItem {...defaultProps} depth={2} />);
    item = screen.getByRole('treeitem');
    expect(item.style.getPropertyValue('--depth')).toBe('2');
  });

  it('renders FolderOpen icon when expanded with children', () => {
    const folderWithChildren = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [createMockFolder({ id: 'subfolder-1', title: 'Subfolder' })],
    });
    render(<FolderItem {...defaultProps} folder={folderWithChildren} isExpanded={true} />);
    const folderIcon = document.querySelector('.lucide-folder-open');
    expect(folderIcon).toBeInTheDocument();
  });

  it('renders closed folder icon when not expanded', () => {
    render(<FolderItem {...defaultProps} />);
    const folderIcon = document.querySelector('.lucide-folder');
    expect(folderIcon).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<FolderItem {...defaultProps} isExpanded={true} isSelected={true} />);
    const item = screen.getByRole('treeitem');
    expect(item).toHaveAttribute('aria-expanded', 'true');
    expect(item).toHaveAttribute('aria-selected', 'true');
  });

  it('is keyboard focusable with tabIndex', () => {
    render(<FolderItem {...defaultProps} />);
    const item = screen.getByRole('treeitem');
    expect(item).toHaveAttribute('tabIndex', '0');
  });

  it('rotates chevron when expanded', () => {
    const folderWithChildren = createMockFolder({
      id: 'folder-1',
      title: 'Work',
      children: [createMockFolder({ id: 'subfolder-1', title: 'Subfolder' })],
    });
    render(<FolderItem {...defaultProps} folder={folderWithChildren} isExpanded={true} />);
    const chevron = document.querySelector('.lucide-chevron-right');
    expect(chevron?.classList.contains('rotate-90')).toBe(true);
  });
});
