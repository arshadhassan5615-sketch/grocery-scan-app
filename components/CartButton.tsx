'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCart } from '@/lib/cart';

export default function CartButton() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () =>
      setCount(getCart().reduce((sum: number, i: any) => sum + i.quantity, 0));
    update();
    window.addEventListener('cart-changed', update);
    return () => window.removeEventListener('cart-changed', update);
  }, []);

  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/scan' ||
    pathname?.startsWith('/receipt/')
  ) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 left-4 z-50 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:bg-blue-700"
    >
      🛒
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
