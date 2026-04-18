# Contributing to KeepOrganizedAI

Thank you for your interest in contributing!

## Development Setup

```bash
npm install
npm run dev
```

Then load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → Select the `dist` folder

## Pre-commit Checklist

Before submitting a PR, ensure:

```bash
npm run lint          # No lint errors
npm run typecheck     # No type errors
npm test             # All tests pass
```

## Code Standards

- **Language**: TypeScript (strict mode)
- **Linting**: ESLint (Airbnb config) + Prettier
- **Testing**: Vitest + React Testing Library
- **UI**: Tailwind CSS + Radix UI

Follow naming conventions from `AGENTS.md`:

- Components: PascalCase (e.g., `FolderTree.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useBookmarks.ts`)
- Utility files: kebab-case (e.g., `date-utils.ts`)

## Branch Naming

Use prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `test/` - Adding tests

Example: `feat/add-folder-search`

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type     | Meaning                            | Example                              |
| -------- | ---------------------------------- | ------------------------------------ |
| feat     | New feature                        | feat: add dark mode toggle           |
| fix      | Bug fix                            | fix: popup not closing on click      |
| chore    | Maintenance, tooling, dependencies | chore: update package versions       |
| docs     | Documentation only                 | docs: update README install steps    |
| style    | Formatting, no logic change        | style: fix indentation in popup.js   |
| refactor | Code restructure, no feature/fix   | refactor: simplify background script |
| test     | Adding or fixing tests             | test: add unit tests for parser      |
| perf     | Performance improvement            | perf: reduce bundle size             |
| ci       | CI/CD config changes               | ci: add GitHub Actions workflow      |
| build    | Build system changes               | build: update webpack config         |
| revert   | Reverts a previous commit          | revert: feat: add dark mode toggle   |

## PR Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the pre-commit checklist
5. Submit a pull request

PRs must pass all CI checks before merging.

## License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v3.
