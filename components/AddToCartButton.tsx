'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/cart';

export default function AddToCartButton({ item }: {
  item: { id: string; name: string; buy_price: number; sell_price: number };
}) {
  const [added, setAdded] = useState(false);
  const [count, setCount] = useState(0);

  const handleAdd = () => {
    addToCart(item);
    setAdded(true);
    setCount((c) => c + 1);
    window.dispatchEvent(new Event('cart-changed'));
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      className={`w-full font-bold text-lg rounded-2xl py-4 min-h-[64px] touch-manipulation transition-colors ${
        added
          ? 'bg-green-600 text-white'
          : 'bg-blue-600 text-white active:bg-blue-700 dark:bg-blue-500 dark:active:bg-blue-600'
      }`}
    >
      {added
        ? count > 1
          ? `Added to Cart (${count})`
          : 'Added to Cart!'
        : 'Add to Cart'}
    </button>
  );
}
