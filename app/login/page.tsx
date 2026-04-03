'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-gray-900">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Price Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Log in to continue</p>
      </div>

      {error && (
        <div className="w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="w-full space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg bg-white dark:bg-gray-800 text-black dark:text-white min-h-[56px] focus:outline-none focus:border-gray-500 touch-manipulation"
          autoComplete="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg bg-white dark:bg-gray-800 text-black dark:text-white min-h-[56px] focus:outline-none focus:border-gray-500 touch-manipulation"
          autoComplete="current-password"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-black text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-8 active:bg-gray-800 dark:bg-white dark:text-black dark:active:bg-gray-200 disabled:bg-gray-400 touch-manipulation"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>

      <p className="text-gray-500 dark:text-gray-400 mt-6 text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 dark:text-blue-400 font-semibold">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
