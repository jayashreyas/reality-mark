
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Mounting Error:", error);
    container.innerHTML = `<div style="color:white;padding:20px;">Mounting Error: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
} else {
  alert("Critical Error: Root container not found in DOM.");
}
