import { useEffect, useState } from 'react';

/**
 * Light/dark theme. Toggles the `dark` class on <body> and persists the choice.
 * A temporary `theme-anim` class on <html> fades colors during the switch only.
 * @returns {[boolean, () => void]} [isDark, toggleTheme]
 */
export default function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 350);
    setDark((v) => !v);
  };

  return [dark, toggle];
}