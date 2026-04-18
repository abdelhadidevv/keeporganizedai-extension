import { XCircle } from 'lucide-react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorState, createErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders message', () => {
    render(<ErrorState message="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders default title when title not provided', () => {
    render(<ErrorState message="Test error message" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState message="Test error message" title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders retry button when retryAction is provided', () => {
    const retryAction = vi.fn();
    render(<ErrorState message="Test error message" retryAction={retryAction} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls retryAction when retry button is clicked', () => {
    const retryAction = vi.fn();
    render(<ErrorState message="Test error message" retryAction={retryAction} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(retryAction).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when retryAction is not provided', () => {
    render(<ErrorState message="Test error message" />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const customIcon = <XCircle data-testid="custom-icon" />;
    render(<ErrorState message="Test error message" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('uses preset configs correctly', () => {
    const errorProps = createErrorState('loadBookmarks');
    expect(errorProps.title).toBe('Failed to load bookmarks');
    expect(errorProps.message).toBe('Could not retrieve your bookmarks. Please try again.');
  });

  it('merge behavior (preset + custom props)', () => {
    const retryAction = vi.fn();
    const errorProps = createErrorState('networkError', { retryAction });
    expect(errorProps.title).toBe('Network error');
    expect(errorProps.message).toBe('Please check your internet connection and try again.');
    expect(errorProps.retryAction).toBe(retryAction);
  });

  it('applies custom className', () => {
    render(<ErrorState message="Test error message" className="custom-class" />);
    const container = screen.getByText('Test error message').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders with default error icon when no icon provided', () => {
    render(<ErrorState message="Test error message" />);
    const alertIcon = document.querySelector('svg');
    expect(alertIcon).toBeInTheDocument();
  });
});
