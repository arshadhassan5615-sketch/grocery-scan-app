'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCart } from '@/lib/cart';

export default function CartButton() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  // Hide on login, signup, scan, and receipt pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/scan' || pathname?.startsWith('/receipt/')) {
    return null;
  }

  useEffect(() => {
    setCount(getCart().reduce((sum, i) => sum + i.quantity, 0));

    const handler = () => setCount(getCart().reduce((sum, i) => sum + i.quantity, 0));
    window.addEventListener('cart-changed', handler);
    return () => window.removeEventListener('cart-changed', handler);
  }, []);

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 left-6 z-50 bg-blue-600 dark:bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:opacity-80 touch-manipulation"
      aria-label="View Cart"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
