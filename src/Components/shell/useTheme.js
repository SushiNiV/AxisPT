import { useEffect, useState } from 'react';

/**
 * Light/dark theme. Toggles the `dark` class on <body> and persists the choice.
 * A temporary `theme-anim` class on <html> fades colors during the switch only.
 * @returns {[boolean, () => void]} [isDark, toggleTheme]
 */
export default function useTheme() {
  // Initialize by checking BOTH localStorage and the actual DOM class
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Fallback to the body class if localStorage is empty (e.g., first load)
    return document.body.classList.contains('dark');
  });

  useEffect(() => {
    // Keep DOM and LocalStorage in sync with React state
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 350);
    setDark((v) => !v);
  };

  return [dark, toggle];
}