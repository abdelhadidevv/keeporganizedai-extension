import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import { Spinner } from './components/ui/Spinner';
import './i18n/config';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<Spinner size="lg" />}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Suspense>
  </StrictMode>
);
