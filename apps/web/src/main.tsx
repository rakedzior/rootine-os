import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { installChunkReloadHandler } from './lib/chunkReload';
import { applyStoredTheme } from './lib/theme';
import './styles/styles.css';
import './features/auth/auth.css';

installChunkReloadHandler();

// Apply stored theme immediately to avoid flash of wrong theme
applyStoredTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
