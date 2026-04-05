'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  { ssr: false }
);

export default function ScanPage() {
  return (
    <div className="flex flex-col h-screen">
      <ErrorBoundary>
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-black text-white">
            <p>Loading camera...</p>
          </div>
        }>
          <BarcodeScanner />
        </Suspense>
      </ErrorBoundary>
      <div className="bg-white dark:bg-gray-900 p-4 pb-8">
        <Link
          href="/"
          className="block w-full text-center bg-gray-200 dark:bg-gray-800 text-black dark:text-white font-semibold rounded-xl py-4 min-h-[56px] active:bg-gray-300 dark:active:bg-gray-700 touch-manipulation"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
