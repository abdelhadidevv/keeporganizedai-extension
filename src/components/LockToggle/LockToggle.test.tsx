import type { LockType } from '@/types/index';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LockToggle } from './LockToggle';

vi.mock('@/services/lockState', () => ({
  lockStateService: {
    setLockState: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSetLockState = vi.mocked(
  (await import('@/services/lockState')).lockStateService.setLockState
);
const mockToast = vi.mocked((await import('sonner')).toast);

const openDropdown = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button'));
};

const getMenuItems = () => screen.getAllByRole('menuitem');

describe('LockToggle', () => {
  const defaultProps = {
    folderId: 'folder-1',
    currentLockState: 'none' as LockType,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetLockState.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders None label for none state', () => {
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('renders Smart Lock label for smart state', () => {
      render(<LockToggle {...defaultProps} currentLockState="smart" />);
      expect(screen.getByText('Smart Lock')).toBeInTheDocument();
    });

    it('renders Hard Lock label for hard state', () => {
      render(<LockToggle {...defaultProps} currentLockState="hard" />);
      expect(screen.getByText('Hard Lock')).toBeInTheDocument();
    });

    it('renders an svg icon for all states', () => {
      const { rerender } = render(<LockToggle {...defaultProps} currentLockState="none" />);
      expect(document.querySelector('svg')).toBeInTheDocument();

      rerender(<LockToggle {...defaultProps} currentLockState="smart" />);
      expect(document.querySelectorAll('svg')).toHaveLength(1);

      rerender(<LockToggle {...defaultProps} currentLockState="hard" />);
      expect(document.querySelectorAll('svg')).toHaveLength(1);
    });

    it('renders a button element as trigger', () => {
      render(<LockToggle {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies custom className to trigger button', () => {
      render(<LockToggle {...defaultProps} className="my-custom-class" />);
      expect(screen.getByRole('button').className).toContain('my-custom-class');
    });

    it('applies gray color styling for none state', () => {
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      expect(screen.getByRole('button').className).toContain('bg-muted');
    });

    it('applies warning (amber) color styling for smart state', () => {
      render(<LockToggle {...defaultProps} currentLockState="smart" />);
      expect(screen.getByRole('button').className).toContain('bg-[var(--color-warning)]');
    });

    it('applies error (red) color styling for hard state', () => {
      render(<LockToggle {...defaultProps} currentLockState="hard" />);
      expect(screen.getByRole('button').className).toContain('bg-[var(--color-error)]');
    });

    it('does not call setLockState on initial mount', () => {
      render(<LockToggle {...defaultProps} />);
      expect(mockSetLockState).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables the button when disabled prop is true', () => {
      render(<LockToggle {...defaultProps} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies disabled opacity styling', () => {
      render(<LockToggle {...defaultProps} disabled />);
      expect(screen.getByRole('button').className).toContain('disabled:opacity-50');
    });

    it('renders with correct label even when disabled', () => {
      render(<LockToggle {...defaultProps} currentLockState="hard" disabled />);
      expect(screen.getByText('Hard Lock')).toBeInTheDocument();
    });
  });

  describe('dropdown menu', () => {
    it('opens dropdown on button click and shows all options', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} />);
      await openDropdown(user);
      expect(screen.getByText('Smart Lock')).toBeInTheDocument();
      expect(screen.getByText('Hard Lock')).toBeInTheDocument();
    });

    it('renders three menu items', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} />);
      await openDropdown(user);
      expect(getMenuItems()).toHaveLength(3);
    });

    it('marks current state with Active label', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="smart" />);
      await openDropdown(user);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('closes dropdown when selecting current state', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      expect(getMenuItems()).toHaveLength(3);
      await user.click(getMenuItems()[0]);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      render(<LockToggle {...defaultProps} />);
      await userEvent.setup().click(screen.getByRole('button'));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      const overlay = document.querySelector('[data-radix-scroll-lock-activator]') as Element;
      if (overlay) {
        fireEvent.pointerDown(overlay);
      } else {
        const outsideEl = document.createElement('div');
        document.body.appendChild(outsideEl);
        fireEvent.pointerDown(outsideEl);
        document.body.removeChild(outsideEl);
      }
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} />);
      await openDropdown(user);
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('service integration', () => {
    it('calls setLockState with smart when selecting Smart Lock', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(mockSetLockState).toHaveBeenCalledWith('folder-1', 'smart');
    });

    it('shows confirmation dialog when selecting Hard Lock', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[2]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Hard Lock is permanent/)).toBeInTheDocument();
    });

    it('confirming hard lock dialog calls setLockState with hard', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[2]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Confirm Hard Lock' }));
      expect(mockSetLockState).toHaveBeenCalledWith('folder-1', 'hard');
    });

    it('cancelling hard lock dialog does not call setLockState', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[2]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockSetLockState).not.toHaveBeenCalled();
    });

    it('calls onChange after successful state change', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<LockToggle {...defaultProps} currentLockState="none" onChange={onChange} />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(onChange).toHaveBeenCalledWith('smart');
    });

    it('shows error toast when service call fails', async () => {
      mockSetLockState.mockRejectedValue(new Error('Storage error'));
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update lock state');
    });

    it('shows warning toast when selecting Smart Lock', async () => {
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(mockToast.warning).toHaveBeenCalledWith('Smart Lock applied', expect.any(Object));
    });

    it('does not call onChange when service call fails', async () => {
      mockSetLockState.mockRejectedValue(new Error('Storage error'));
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<LockToggle {...defaultProps} currentLockState="none" onChange={onChange} />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows spinner when service call is pending', async () => {
      mockSetLockState.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('disables button while loading', async () => {
      mockSetLockState.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<LockToggle {...defaultProps} currentLockState="none" />);
      await openDropdown(user);
      await user.click(getMenuItems()[1]);
      const trigger = screen.getByRole('button');
      expect(trigger).toBeDisabled();
    });
  });
});
