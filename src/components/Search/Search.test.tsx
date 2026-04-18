import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Search } from './Search';

describe('Search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input with placeholder', () => {
    render(<Search placeholder="Find bookmarks..." />);
    expect(screen.getByPlaceholderText('Find bookmarks...')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<Search />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders with search icon', () => {
    render(<Search />);
    const searchIcon = document.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('calls onChange when text is entered', async () => {
    const onChange = vi.fn();
    render(<Search onChange={onChange} debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onSearch after debounce delay', async () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onSearch).not.toHaveBeenCalled();
    await act(async () => {
      vi.runAllTimers();
    });
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('calls onSearch with empty string when cleared', async () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onSearch).toHaveBeenLastCalledWith('test');
    await act(async () => {
      vi.runAllTimers();
    });
    fireEvent.click(screen.getByTitle('Clear search'));
    expect(onSearch).toHaveBeenLastCalledWith('');
  });

  it('shows clear button when input has value', () => {
    render(<Search debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(screen.getByTitle('Clear search')).toBeInTheDocument();
  });

  it('hides clear button when input is empty', () => {
    render(<Search />);
    expect(screen.queryByTitle('Clear search')).not.toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    const onChange = vi.fn();
    render(<Search onChange={onChange} debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(input).toHaveValue('hello');
    fireEvent.click(screen.getByTitle('Clear search'));
    expect(input).toHaveValue('');
  });

  it('focuses input when clear button is clicked', () => {
    render(<Search debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByTitle('Clear search'));
    expect(input).toHaveFocus();
  });

  it('calls onSearch with Enter key', async () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('does not call debounced onSearch after Enter', async () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => {
      vi.runAllTimers();
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('respects controlled value prop', async () => {
    const onChange = vi.fn();
    render(<Search value="controlled" onChange={onChange} debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('controlled');
    fireEvent.change(input, { target: { value: 'controlledx' } });
    expect(onChange).toHaveBeenCalledWith('controlledx');
  });

  it('handles debounceMs of 0', () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={0} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'instant' } });
    expect(onSearch).toHaveBeenCalledWith('instant');
  });

  it('clears previous debounce timer when typing', async () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'a' } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: 'ab' } });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    fireEvent.change(input, { target: { value: 'abc' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('abc');
  });

  it('clears debounce timer on unmount', async () => {
    const onSearch = vi.fn();
    const { unmount } = render(<Search onSearch={onSearch} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    unmount();
    await act(async () => {
      vi.runAllTimers();
    });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('has correct ARIA role', () => {
    render(<Search />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Search disabled />);
    const input = screen.getByRole('searchbox');
    expect(input).toBeDisabled();
  });

  it('handles className prop', () => {
    render(<Search className="custom-class" />);
    const input = screen.getByRole('searchbox');
    expect(input.classList.contains('custom-class')).toBe(true);
  });

  it('clears timer when onSearch prop changes', async () => {
    const onSearch1 = vi.fn();
    const onSearch2 = vi.fn();
    const { rerender } = render(<Search onSearch={onSearch1} debounceMs={300} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    rerender(<Search onSearch={onSearch2} debounceMs={300} />);
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(onSearch1).not.toHaveBeenCalled();
    expect(onSearch2).toHaveBeenCalledWith('test');
  });
});
