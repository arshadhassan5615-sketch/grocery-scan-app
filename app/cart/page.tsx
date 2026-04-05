'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartSummary,
  type CartItem,
} from '@/lib/cart';
import { VAT_RATE } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [summary, setSummary] = useState(getCartSummary());
  const [showProfit, setShowProfit] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOwner(sessionStorage.getItem('grocery-role') === 'owner');
    }
    refresh();
  }, []);

  const refresh = useCallback(() => {
    setCart(getCart());
    setSummary(getCartSummary());
  }, []);

  const handleIncrement = (id: string) => {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    updateQuantity(id, item.quantity + 1);
    refresh();
  };

  const handleDecrement = (id: string) => {
    const item = cart.find((c) => c.id === id);
    if (!item || item.quantity <= 1) return;
    updateQuantity(id, item.quantity - 1);
    refresh();
  };

  const handleRemove = (id: string) => {
    removeFromCart(id);
    refresh();
  };

  const handleClear = () => {
    if (!confirm('Clear all items from cart?')) return;
    clearCart();
    refresh();
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return;
    setFinalizeLoading(true);

    try {
      // Fetch current stock for each item
      const stockResult = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in(
          'id',
          summary.items.map((i) => i.id)
        );

      const stockMap = new Map<string, number>();
      if (stockResult.data) {
        for (const row of stockResult.data) {
          stockMap.set(row.id, row.stock_quantity ?? 0);
        }
      }

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const transactionId = `TXN-${dateStr}-${random4}`;

      const transactionItems = summary.items.map((item) => ({
        id: item.id,
        name: item.name,
        buy_price: item.buy_price,
        sell_price: item.sell_price,
        quantity: item.quantity,
        lineTotal: parseFloat(item.lineTotal),
      }));

      const { data, error: txnError } = await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          items: transactionItems,
          subtotal: parseFloat(summary.subtotal),
          vat_amount: parseFloat(summary.vat),
          grand_total: parseFloat(summary.grandTotal),
          total_profit: parseFloat(summary.totalProfit),
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Deduct stock
      for (const item of summary.items) {
        const current = stockMap.get(item.id) ?? 0;
        const newQty = Math.max(0, current - item.quantity);
        await supabase.from('products').update({ stock_quantity: newQty }).eq('id', item.id);
      }

      clearCart();
      window.dispatchEvent(new Event('cart-changed'));
      router.push(`/receipt/${data.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to finalize bill. Please try again.');
    } finally {
      setFinalizeLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Shopping Cart</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Your cart is empty</p>
        <Link
          href="/scan"
          className="bg-black dark:bg-white dark:text-black text-white font-semibold px-6 py-4 rounded-xl min-h-[56px] active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
        >
          Start Scanning
        </Link>
        <Link
          href="/"
          className="mt-4 text-blue-600 dark:text-blue-400 active:text-blue-800 dark:active:text-blue-300 touch-manipulation"
        >
          Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Cart ({summary.items.length} item{summary.items.length !== 1 ? 's' : ''})</h1>
      </div>

      {isOwner && (
        <button
          onClick={() => setShowProfit(!showProfit)}
          className={`w-full mb-4 text-sm font-semibold rounded-xl py-3 min-h-[48px] touch-manipulation ${
            showProfit
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {showProfit ? 'Hide Profit View' : 'Show Profit View'}
        </button>
      )}

      <div className="space-y-2 mb-6">
        {summary.items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
          >
            <p className="font-medium text-base truncate dark:text-white">{item.name}</p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecrement(item.id)}
                  disabled={item.quantity <= 1}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold flex items-center justify-center active:bg-gray-300 dark:active:bg-gray-600 disabled:opacity-40 touch-manipulation"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-lg dark:text-white">{item.quantity}</span>
                <button
                  onClick={() => handleIncrement(item.id)}
                  className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold flex items-center justify-center active:bg-gray-300 dark:active:bg-gray-600 touch-manipulation"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AED {parseFloat(item.sell_price.toString()).toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                AED {item.lineTotal}
              </p>
              <div className="flex items-center gap-2">
                {showProfit && isOwner && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    Profit: AED {item.profit}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/30 rounded-xl touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Subtotal</span>
          <span>AED {summary.subtotal}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>VAT ({(VAT_RATE * 100).toFixed(0)}%)</span>
          <span>AED {summary.vat}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg dark:text-white">
          <span>Grand Total</span>
          <span>AED {summary.grandTotal}</span>
        </div>

        {showProfit && isOwner && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold text-purple-600 dark:text-purple-400">
              <span>Total Profit</span>
              <span>AED {summary.totalProfit}</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400">
              <span>Profit Margin</span>
              <span>
                {(
                  (parseFloat(summary.totalProfit) / Math.max(1, parseFloat(summary.subtotal))) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleFinalize}
        disabled={finalizeLoading}
        className="w-full bg-green-600 text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] active:bg-green-700 disabled:bg-gray-400 touch-manipulation"
      >
        {finalizeLoading ? 'Processing...' : 'Finalize Bill'}
      </button>
      <button
        onClick={handleClear}
        className="w-full bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 border-2 border-red-300 dark:border-red-700 font-semibold rounded-2xl py-3 min-h-[56px] mt-2 active:bg-red-50 dark:active:bg-red-900/30 touch-manipulation"
      >
        Clear Cart
      </button>
    </div>
  );
}
