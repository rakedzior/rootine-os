import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { applyStoredTheme } from './lib/theme';
import './styles/styles.css';
import './styles/travel.css';
import './styles/work.css';
import './styles/desk.css';
import './styles/health.css';
import './styles/notes.css';
import './styles/nutrition.css';
import './styles/sport.css';
import './features/auth/auth.css';
import './styles/rootine-theme.css';
import './styles/rootine-system.css';

// Apply stored theme immediately to avoid flash of wrong theme
applyStoredTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
