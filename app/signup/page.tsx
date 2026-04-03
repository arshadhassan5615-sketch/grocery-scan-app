'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError(null);

    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Create Account</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sign up to start scanning</p>
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
          autoComplete="new-password"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg bg-white dark:bg-gray-800 text-black dark:text-white min-h-[56px] focus:outline-none focus:border-gray-500 touch-manipulation"
          autoComplete="new-password"
        />
      </div>

      <button
        onClick={handleSignup}
        disabled={loading}
        className="w-full bg-green-600 text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-8 active:bg-green-700 disabled:bg-gray-400 touch-manipulation"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="text-gray-500 dark:text-gray-400 mt-6 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold">
          Log In
        </Link>
      </p>
    </div>
  );
}
