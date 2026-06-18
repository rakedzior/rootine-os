import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/styles.css';
import './features/auth/auth.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
