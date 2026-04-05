'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OWNER_PIN, STAFF_PIN } from '@/lib/config';

export default function PinEntry() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = sessionStorage.getItem('grocery-role');
    if (role) router.replace('/');
  }, [router]);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === OWNER_PIN) {
        sessionStorage.setItem('grocery-role', 'owner');
        router.replace('/');
      } else if (next === STAFF_PIN) {
        sessionStorage.setItem('grocery-role', 'staff');
        router.replace('/');
      } else {
        setError('Incorrect PIN');
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setTimeout(() => setPin(''), 800);
        setTimeout(() => setError(''), 2000);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white dark:bg-gray-900">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Price Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Enter your PIN to continue</p>
      </div>

      {error && (
        <div className="w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? 'bg-black dark:bg-white border-black dark:border-white'
                : 'border-gray-300 dark:border-gray-600'
            } ${shaking && i < pin.length ? 'animate-pulse' : ''}`}
          />
        ))}
      </div>

      <div className={`grid grid-cols-3 gap-4 w-full max-w-xs ${shaking ? 'animate-bounce' : ''}`}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'BACK'].map((key, i) => (
          <div key={i} className="flex items-center justify-center">
            {key === '' ? (
              <div />
            ) : key === 'BACK' ? (
              <button
                onClick={handleBackspace}
                className="w-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-semibold text-lg rounded-2xl py-5 min-h-[64px] active:bg-gray-300 dark:active:bg-gray-600 touch-manipulation"
              >
                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414a2 2 0 011.414-.586H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 01-1.414-.586L3 12z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => handleDigit(key)}
                className="w-full bg-white dark:bg-gray-800 text-black dark:text-white font-semibold text-2xl rounded-2xl py-5 min-h-[64px] border-2 border-gray-300 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
              >
                {key}
              </button>
            )}
          </div>
        ))}
      </div>

      {pin.length > 0 && (
        <button
          onClick={handleClear}
          className="mt-6 text-gray-500 dark:text-gray-400 text-sm active:text-gray-700 dark:active:text-gray-300 touch-manipulation"
        >
          Clear
        </button>
      )}
    </div>
  );
}
