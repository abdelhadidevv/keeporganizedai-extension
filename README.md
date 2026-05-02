![Logo](icons/logo-readme.svg)

[![License: GPL v3](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ejcmcpeohpjbipdfhpmfohpdefgbdfpl)](https://chromewebstore.google.com/detail/keeporganizedai/ejcmcpeohpjbipdfhpmfohpdefgbdfpl)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/ejcmcpeohpjbipdfhpmfohpdefgbdfpl)](https://chromewebstore.google.com/detail/keeporganizedai/ejcmcpeohpjbipdfhpmfohpdefgbdfpl)
[![TypeScript](https://img.shields.io/badge/TypeScript-97%25-3178c6)](https://github.com/abdelhadidevv/keeporganizedai-extension)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://github.com/abdelhadidevv/keeporganizedai-extension)

AI-powered Chrome extension that automatically organizes your bookmarks through a 3 simple step wizard.

## Features

- **AI Categorization** - Uses Gemini, Claude, or OpenAI to analyze and categorize bookmarks
- **Folder Locking** - Hard Lock (protect entirely) or Smart Lock (preserve as category)
- **3-Step Wizard** - Lock folders → Generate categories → Apply organization
- **Automatic Backup** - Creates backup before any changes; download anytime
- **Global Search** - Find any bookmark instantly
- **Dark/Light Theme** - Follows your system preference

![How it works](icons/how-it-works.svg)

## Quick Start

```bash
npm install
npm run dev
```

Load the extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → Select the `dist` folder

## AI Setup

Configure your API key in the Settings screen (click the gear icon).

### Ollama (Local)

If using Ollama with this extension, start it with CORS enabled:

```bash
OLLAMA_ORIGINS=chrome-extension://* ollama serve
```

This allows the extension to communicate with your local Ollama instance.

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Development mode with hot reload |
| `npm run build`     | Production build                 |
| `npm run lint`      | Lint code                        |
| `npm run typecheck` | Type check                       |
| `npm test`          | Run tests                        |

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · Zustand · Radix UI

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for all notable changes.

## License

Licensed under the [GNU General Public License v3](./LICENSE).
