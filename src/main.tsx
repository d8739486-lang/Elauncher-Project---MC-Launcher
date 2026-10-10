import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Block all standard browser shortcuts and context menus for pure native app feel
if (typeof window !== 'undefined') {
  // 1. Disable browser right-click context menu
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. Disable image/link dragging
  window.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 3. Disable browser zoom via wheel + Ctrl
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });

  // 4. Block common browser hotkeys (F12, Inspect, View Source, Save Page, Print, Zoom)
  window.addEventListener('keydown', (e) => {
    // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+Shift+C (DevTools)
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+S (Save Page)
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      return false;
    }

    // Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      return false;
    }

    // Ctrl + / - / 0 (Browser Zoom)
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
      e.preventDefault();
      return false;
    }

    // Backspace navigation outside inputs
    if (e.key === 'Backspace') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
  }, { capture: true });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
