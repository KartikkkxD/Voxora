import { useState, useEffect } from 'react';

/**
 * Custom hook to manage Light/Dark theme toggling.
 * Persists theme preference in localStorage and toggles the '.dark' class on the document root.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voxora-theme');
      if (saved) return saved;
      
      // Fallback to system preferences
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      return media.matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('voxora-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, isDark: theme === 'dark', toggleTheme };
};
