# KeepOrganizedAI — Agent Guidelines

## Project Overview

Chrome/Edge extension that uses AI (Gemini/Claude) to auto-organize browser bookmarks via a 5-step wizard. Users can lock folders, review AI suggestions, and undo changes.

---

## Tech Stack

- **Language**: TypeScript (strict mode)
- **UI Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: CSS Modules or Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint (Airbnb config) + Prettier
- **Extension API**: Chrome Extensions Manifest V3

---

## Build Commands

```bash
# Install dependencies
npm install

# Development (watch mode + extension reload)
npm run dev

# Build for production
npm run build

# Lint all files
npm run lint

# Fix auto-fixable lint errors
npm run lint:fix

# Format code with Prettier
npm run format

# Type check
npm run typecheck

# Run all tests
npm test

# Run single test file
npx vitest run src/components/Button.test.tsx

# Run single test in watch mode
npx vitest src/components/Button.test.tsx

# Run tests matching a pattern
npx vitest run --grep "Folder"

# Coverage report
npm run test:coverage

# Build and package for Chrome Web Store (if available)
npm run package
```

---

## Project Structure

```
src/
├── background/          # Service worker (Manifest V3)
│   └── index.ts
├── components/         # React components
│   ├── FolderTree/
│   ├── BookmarkItem/
│   ├── StepWizard/
│   ├── Search/         # Debounced search input (Phase 3.4)
│   ├── LockToggle/     # Folder lock state dropdown (Phase 3.5)
│   ├── EmptyState/     # Empty state placeholder (Phase 3.6)
│   ├── LoadingState/   # Loading indicator (Phase 3.7)
│   ├── ErrorState/     # Error state with retry (Phase 3.8)
│   └── ui/             # Shared UI primitives
├── hooks/              # Custom React hooks
├── services/           # Business logic
│   ├── bookmarks.ts     # chrome.bookmarks API wrapper
│   ├── ai.ts           # AI provider integration
│   └── storage.ts      # chrome.storage wrapper
├── types/              # TypeScript interfaces
├── utils/              # Pure utility functions
├── test/               # Test setup and utilities
├── App.tsx
├── main.tsx
└── styles/
```

---

## Code Style Guidelines

### TypeScript

- Use explicit types; avoid `any`
- Prefer `interface` over `type` for object shapes
- Use strict TypeScript (`strict: true` in tsconfig)
- Export types used across files; keep internal types scoped

```typescript
// Good
interface Bookmark {
  id: string;
  title: string;
  url: string;
  parentId: string | null;
}

type LockType = 'none' | 'hard' | 'smart';

// Avoid
const process = (data: any) => any;
```

### Imports

- Use absolute imports via `@/` alias
- Group imports: 1) React, 2) internal, 3) third-party, 4) types
- Named exports preferred over default exports for components

```typescript
import { useState, useCallback } from 'react';
import { FolderTree } from '@/components/FolderTree';
import { Bookmark } from '@/types';
import { useBookmarks } from '@/hooks/useBookmarks';
```

### Naming Conventions

| Item              | Convention                  | Example             |
| ----------------- | --------------------------- | ------------------- |
| Components        | PascalCase                  | `FolderTree.tsx`    |
| Hooks             | camelCase with `use` prefix | `useBookmarks.ts`   |
| Types/Interfaces  | PascalCase                  | `BookmarkNode`      |
| Constants         | UPPER_SNAKE_CASE            | `MAX_CATEGORIES`    |
| Files (utilities) | kebab-case                  | `date-utils.ts`     |
| CSS Modules       | Component.module.css        | `Button.module.css` |

### React Components

- Functional components with hooks only
- Props interfaces defined above component
- Destructure props in function signature
- Keep components under 150 lines; extract logic to hooks

```typescript
interface FolderItemProps {
  folder: Folder;
  depth: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export function FolderItem({ folder, depth, onSelect, isSelected }: FolderItemProps) {
  // ...
}
```

### Error Handling

- Use custom error classes for domain errors
- Wrap async operations in try/catch
- Display user-friendly error messages
- Always log errors for debugging

```typescript
class BookmarkError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'BookmarkError';
  }
}

try {
  await chrome.bookmarks.remove(id);
} catch (error) {
  if (error instanceof Error) {
    console.error('[BookmarkService]', error.message);
    throw new BookmarkError('Failed to delete bookmark', 'DELETE_FAILED');
  }
}
```

### Chrome Extension Specifics

- Handle `chrome.runtime.lastError` for all Chrome API calls
- Use `chrome.storage.local` for session data, `chrome.storage.sync` for user preferences
- Content scripts communicate via message passing
- Always declare all permissions in `manifest.json`

```typescript
export function getBookmarks(): Promise<BookmarkTreeNode[]> {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result);
    });
  });
}
```

### Testing

- Test behavior, not implementation
- Mock Chrome APIs using `vi.mock('chrome')` or `vi.mock('@/services/...')`
- Use `userEvent` for user interactions with Radix UI components (dropdown menus, dialogs, etc.)
- Use `fireEvent` for simple interactions and edge cases
- Use `act(vi.runAllTimers())` for async state updates (not `waitFor`)
- One describe block per component/function
- For Radix DropdownMenu: use `userEvent.click()` on trigger, then `screen.getAllByRole('menuitem')` for menu items
- For Radix Modal: use `screen.getByRole('dialog')` and `screen.getByRole('button', { name: '...' })`

```typescript
describe('FolderTree', () => {
  it('renders nested folders with correct indentation', async () => {
    // Arrange
    const folders = [createMockFolder({ depth: 1 }), createMockFolder({ depth: 2 })];

    // Act
    render(<FolderTree folders={folders} />);

    // Assert
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});
```

---

## Commit Conventions

Use Conventional Commits:

```
feat: add folder lock toggle UI
fix: handle empty bookmark tree gracefully
refactor: extract AI categorization logic to service
test: add coverage for bookmark migration
docs: update PRD with new error states
```

---

## Performance Notes

- Lazy load components outside initial view
- Memoize expensive computations with `useMemo`/`useCallback`
- Debounce search input (300ms)
- Batch Chrome API calls when possible
