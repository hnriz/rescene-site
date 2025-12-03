import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Scroll para o topo quando a página carrega
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
});

// Previne que o scroll seja restaurado em F5
window.addEventListener('beforeunload', () => {
  window.scrollTo(0, 0);
});

// Também trata popstate (quando volta usando botão back)
window.addEventListener('popstate', () => {
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



/* Rebuilt 2025-12-03 00:28:09 */
