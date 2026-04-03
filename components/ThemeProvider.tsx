'use client';

import { useEffect, createContext, useContext, useState, useCallback } from 'react';

type ThemeContextType = {
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({ toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    let isDark: boolean;

    if (stored === 'dark' || stored === 'light') {
      isDark = stored === 'dark';
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const newIsDark = !isCurrentlyDark;
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ toggleTheme }}>
      {mounted ? children : <div className="bg-white min-h-screen">{children}</div>}
    </ThemeContext.Provider>
  );
}
