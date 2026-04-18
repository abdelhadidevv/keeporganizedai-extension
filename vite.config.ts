import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function manifestPlugin(): Plugin {
  const manifestPath = path.resolve(__dirname, 'manifest.json');
  const distPath = path.resolve(__dirname, 'dist');

  return {
    name: 'vite-plugin-chrome-extension',
    closeBundle() {
      fs.copyFileSync(manifestPath, path.join(distPath, 'manifest.json'));
    },
  };
}

function copyIconsPlugin(): Plugin {
  const iconsSrc = path.resolve(__dirname, 'icons');
  const iconsDist = path.resolve(__dirname, 'dist/icons');

  return {
    name: 'vite-plugin-copy-icons',
    closeBundle() {
      if (!fs.existsSync(iconsDist)) {
        fs.mkdirSync(iconsDist, { recursive: true });
      }
      fs.readdirSync(iconsSrc).forEach((file) => {
        fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDist, file));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), manifestPlugin(), copyIconsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
