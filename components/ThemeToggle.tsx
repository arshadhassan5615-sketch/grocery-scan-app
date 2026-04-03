'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { createBrowserClient } from '@/lib/supabase';

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      <button
        onClick={handleLogout}
        className="bg-red-500 dark:bg-red-600 text-white text-xs font-semibold rounded-full px-4 py-2 shadow-lg active:opacity-80 touch-manipulation"
      >
        Logout
      </button>
      <button
        onClick={toggleTheme}
        className="bg-black dark:bg-white text-white dark:text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:opacity-80 touch-manipulation"
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  );
}
