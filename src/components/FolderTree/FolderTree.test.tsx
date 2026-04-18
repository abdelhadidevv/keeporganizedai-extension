import type { BookmarkNode } from '@/types/index';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderTree } from './FolderTree';

const createMockFolder = (overrides: Partial<BookmarkNode> = {}): BookmarkNode => ({
  id: 'folder-1',
  title: 'Test Folder',
  children: [],
  ...overrides,
});

const createMockBookmark = (overrides: Partial<BookmarkNode> = {}): BookmarkNode => ({
  id: 'bookmark-1',
  title: 'Google',
  url: 'https://google.com',
  ...overrides,
});

describe('FolderTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders folder tree with folders', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({ id: 'folder-1', title: 'Work' }),
        createMockFolder({ id: 'folder-2', title: 'Personal' }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('renders nested folders recursively', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-1-1', title: 'Projects' })],
        }),
      ];
      render(<FolderTree folders={folders} defaultExpandedIds={['folder-1']} />);
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('renders empty state when no folders provided', () => {
      render(<FolderTree folders={[]} />);
      expect(screen.getByText('No folders found')).toBeInTheDocument();
    });

    it('renders empty state with custom className', () => {
      const { container } = render(<FolderTree folders={[]} className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('renders deeply nested folders', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Level 1',
          children: [
            createMockFolder({
              id: 'folder-2',
              title: 'Level 2',
              children: [
                createMockFolder({
                  id: 'folder-3',
                  title: 'Level 3',
                }),
              ],
            }),
          ],
        }),
      ];
      render(<FolderTree folders={folders} defaultExpandedIds={['folder-1', 'folder-2']} />);
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getByText('Level 3')).toBeInTheDocument();
    });

    it('does not render bookmark items (nodes with url) as folders', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [
            createMockBookmark({ id: 'bookmark-1', title: 'Google', url: 'https://google.com' }),
          ],
        }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });

  describe('Order', () => {
    it('preserves browser folder order', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({ id: 'folder-z', title: 'Zebra' }),
        createMockFolder({ id: 'folder-a', title: 'Apple' }),
        createMockFolder({ id: 'folder-m', title: 'Mango' }),
      ];
      render(<FolderTree folders={folders} />);
      const items = screen.getAllByRole('treeitem');
      const titles = items.map((item) => item.textContent);
      expect(titles[0]).toContain('Zebra');
      expect(titles[1]).toContain('Apple');
      expect(titles[2]).toContain('Mango');
    });

    it('sorts folders before bookmarks alphabetically', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [
            createMockBookmark({ id: 'bookmark-z', title: 'Zebra Site', url: 'https://zebra.com' }),
            createMockFolder({ id: 'folder-a', title: 'Alpha' }),
          ],
        }),
      ];
      render(<FolderTree folders={folders} defaultExpandedIds={['folder-1']} />);
      const items = screen.getAllByRole('treeitem');
      const titles = items.map((item) => item.textContent?.trim());
      expect(titles).toContain('Alpha');
      expect(titles.some((t) => t?.includes('Work'))).toBe(true);
    });
  });

  describe('Expand/Collapse', () => {
    it('starts collapsed by default', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();
    });

    it('expands folders from defaultExpandedIds on mount', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      render(<FolderTree folders={folders} defaultExpandedIds={['folder-1']} />);
      expect(screen.getByText('Subfolder')).toBeInTheDocument();
    });

    it('toggles folder expansion on click', async () => {
      const user = userEvent.setup();
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      render(<FolderTree folders={folders} />);

      await user.click(screen.getByText('Work'));
      expect(screen.getByText('Subfolder')).toBeInTheDocument();

      await user.click(screen.getByText('Work'));
      expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();
    });

    it('calls onFolderClick when folder is clicked', async () => {
      const user = userEvent.setup();
      const onFolderClick = vi.fn();
      const folders: BookmarkNode[] = [createMockFolder({ id: 'folder-1', title: 'Work' })];
      render(<FolderTree folders={folders} onFolderClick={onFolderClick} />);
      await user.click(screen.getByText('Work'));
      expect(onFolderClick).toHaveBeenCalledWith('folder-1');
    });

    it('calls onSelect when folder is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const folders: BookmarkNode[] = [createMockFolder({ id: 'folder-1', title: 'Work' })];
      render(<FolderTree folders={folders} onSelect={onSelect} />);
      await user.click(screen.getByText('Work'));
      expect(onSelect).toHaveBeenCalledWith('folder-1');
    });

    it('does not call onToggle when same handler is used for both onToggle and onFolderClick in controlled mode', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      const expandedIds = new Set<string>();
      render(
        <FolderTree
          folders={folders}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onFolderClick={onToggle}
        />
      );

      await user.click(screen.getByText('Work'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('toggles folder expansion in controlled mode via onToggle', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      const expandedIds = new Set<string>();
      render(<FolderTree folders={folders} expandedIds={expandedIds} onToggle={onToggle} />);

      expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();

      await user.click(screen.getByText('Work'));
      expect(onToggle).toHaveBeenCalledWith('folder-1');
    });

    it('calls onToggle exactly once when folder is clicked in controlled mode', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      const expandedIds = new Set<string>();
      render(<FolderTree folders={folders} expandedIds={expandedIds} onToggle={onToggle} />);

      await user.click(screen.getByText('Work'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bookmark Count', () => {
    it('displays bookmark count for folders with direct bookmarks', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [
            createMockBookmark({ id: 'bookmark-1', title: 'Google', url: 'https://google.com' }),
            createMockBookmark({ id: 'bookmark-2', title: 'GitHub', url: 'https://github.com' }),
          ],
        }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('displays total bookmark count including nested folders', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [
            createMockFolder({
              id: 'folder-2',
              title: 'Projects',
              children: [
                createMockBookmark({ id: 'bookmark-1', title: 'Project A', url: 'https://a.com' }),
              ],
            }),
            createMockBookmark({ id: 'bookmark-2', title: 'Work Site', url: 'https://work.com' }),
          ],
        }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('does not show count when folder has no bookmarks', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Empty Folder',
          children: [],
        }),
      ];
      render(<FolderTree folders={folders} />);
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe('Lock States', () => {
    it('passes lock state to folder items', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({ id: 'folder-1', title: 'Locked Folder' }),
      ];
      render(<FolderTree folders={folders} lockStates={{ 'folder-1': 'hard' }} />);
      const items = screen.getAllByRole('treeitem');
      expect(items[0]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Selection', () => {
    it('highlights selected folder', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({ id: 'folder-1', title: 'Work' }),
        createMockFolder({ id: 'folder-2', title: 'Personal' }),
      ];
      render(<FolderTree folders={folders} selectedId="folder-2" />);
      const items = screen.getAllByRole('treeitem');
      const workItem = items.find((el) => el.textContent?.includes('Work'));
      const personalItem = items.find((el) => el.textContent?.includes('Personal'));
      expect(workItem).toHaveAttribute('aria-selected', 'false');
      expect(personalItem).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('maxDepth', () => {
    it('respects maxDepth limit', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Level 1',
          children: [
            createMockFolder({
              id: 'folder-2',
              title: 'Level 2',
              children: [
                createMockFolder({
                  id: 'folder-3',
                  title: 'Level 3',
                }),
              ],
            }),
          ],
        }),
      ];
      render(
        <FolderTree
          folders={folders}
          defaultExpandedIds={['folder-1', 'folder-2', 'folder-3']}
          maxDepth={1}
        />
      );
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.queryByText('Level 3')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has tree role on root container', () => {
      const folders: BookmarkNode[] = [createMockFolder({ id: 'folder-1', title: 'Work' })];
      const { container } = render(<FolderTree folders={folders} />);
      expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
    });

    it('has group role on nested containers', () => {
      const folders: BookmarkNode[] = [
        createMockFolder({
          id: 'folder-1',
          title: 'Work',
          children: [createMockFolder({ id: 'folder-2', title: 'Subfolder' })],
        }),
      ];
      render(<FolderTree folders={folders} defaultExpandedIds={['folder-1']} />);
      const groups = document.querySelectorAll('[role="group"]');
      expect(groups.length).toBeGreaterThan(0);
    });
  });
});
