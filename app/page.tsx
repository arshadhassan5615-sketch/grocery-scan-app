'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Price Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Scan or search to find prices</p>
      </div>

      <Link
        href="/scan"
        className="w-full bg-black text-white text-xl font-semibold rounded-2xl flex items-center justify-center min-h-[72px] active:bg-gray-800 dark:bg-white dark:text-black dark:active:bg-gray-200 transition-colors touch-manipulation"
      >
        <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2m4 0h2m4 0h2m4 0h2m4 0h2M3 12h2m14 0h2M3 17h2m4 0h2m4 0h2m4 0h2M7 3v4m0 10v4m10-14v4m0 10v4" />
        </svg>
        Scan Barcode
      </Link>

      <Link
        href="/search"
        className="w-full bg-white text-black dark:bg-gray-800 dark:text-white text-xl font-semibold rounded-2xl border-2 border-black dark:border-gray-400 flex items-center justify-center min-h-[72px] active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation"
      >
        <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search by Name
      </Link>

      <Link
        href="/add"
        className="w-full bg-green-600 text-white text-xl font-semibold rounded-2xl flex items-center justify-center min-h-[72px] active:bg-green-700 dark:bg-green-500 dark:active:bg-green-600 transition-colors touch-manipulation"
      >
        <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Item Manually
      </Link>

      <Link
        href="/all"
        className="text-blue-600 dark:text-blue-400 text-base mt-8 py-3 px-6 active:text-blue-800 dark:active:text-blue-300 touch-manipulation"
      >
        View All Items
      </Link>
    </div>
  );
}
