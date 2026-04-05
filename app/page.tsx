'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PinEntry from '@/components/PinEntry';
import { useInactivityTimeout } from '@/components/PinGuard';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [role, setRole] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<Array<{ name: string; stock: number }>>([]);
  const [expiringSoon, setExpiringSoon] = useState<number>(0);
  const [debtTotal, setDebtTotal] = useState<number>(0);
  const [debtCount, setDebtCount] = useState<number>(0);
  const [checked, setChecked] = useState(false);

  useInactivityTimeout();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('grocery-role');
    if (stored) {
      setRole(stored);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!checked || role !== 'owner') return;
    const checkStock = async () => {
      const { data } = await supabase
        .from('products')
        .select('name, stock_quantity, low_stock_threshold')
        .lte('stock_quantity', 10);
      if (data) {
        const below = data.filter(
          (i) => (i.stock_quantity ?? 0) <= (i.low_stock_threshold ?? 5)
        );
        setLowStockItems(below.map((i) => ({ name: i.name, stock: i.stock_quantity ?? 0 })));
      }
    };
    checkStock();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    const in7Str = in7Days.toISOString().split('T')[0];

    const checkExpiry = async () => {
      const { data } = await supabase
        .from('products')
        .select('expiry_date')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', in7Str);
      if (data) {
        const expiring = data.filter((d) => {
          const expDate = new Date(d.expiry_date!);
          return expDate >= today;
        });
        setExpiringSoon(expiring.length);
      }
    };
    checkExpiry();

    // Check outstanding debts
    const checkDebts = async () => {
      const { data } = await supabase
        .from('debts')
        .select('amount, is_paid')
        .eq('is_paid', false);
      if (data) {
        const total = data.reduce((s, d) => s + d.amount, 0);
        setDebtTotal(total);
        setDebtCount(data.length);
      }
    };
    checkDebts();
  }, [checked, role]);

  if (!checked) return null;

  if (role !== 'owner' && role !== 'staff') {
    return <PinEntry />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      {role === 'owner' && (
        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Owner Mode</p>
      )}
      {role === 'staff' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Staff Mode</p>
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">Price Scanner</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Scan or search to find prices</p>
      </div>

      {/* Low stock banner */}
      {role === 'owner' && lowStockItems.length > 0 && (
        <Link
          href="/stock"
          className="w-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 active:bg-yellow-100 dark:active:bg-yellow-900/50 touch-manipulation"
        >
          <p className="text-yellow-700 dark:text-yellow-300 text-sm font-semibold">
            Low stock: {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}
          </p>
          {lowStockItems.slice(0, 2).map((item, i) => (
            <p key={i} className="text-yellow-600 dark:text-yellow-400 text-xs">{item.name} ({item.stock} left)</p>
          ))}
          {lowStockItems.length > 2 && (
            <p className="text-yellow-600 dark:text-yellow-400 text-xs">+ {lowStockItems.length - 2} more</p>
          )}
        </Link>
      )}

      {/* Expiry warning banner */}
      {role === 'owner' && expiringSoon > 0 && (
        <Link
          href="/expiry"
          className="w-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 active:bg-orange-100 dark:active:bg-orange-900/50 touch-manipulation"
        >
          <p className="text-orange-700 dark:text-orange-300 text-sm font-semibold">
            Expiring soon: {expiringSoon} item{expiringSoon > 1 ? 's' : ''} — tap to review
          </p>
        </Link>
      )}

      {/* Debt banner */}
      {role === 'owner' && debtCount > 0 && (
        <Link
          href="/customers"
          className="w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 active:bg-red-100 dark:active:bg-red-900/50 touch-manipulation"
        >
          <p className="text-red-700 dark:text-red-300 text-sm font-semibold">
            {debtCount} customer{debtCount > 1 ? 's have' : ' has'} outstanding tabs — AED {debtTotal.toFixed(2)}
          </p>
        </Link>
      )}

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

      {role === 'owner' && (
        <Link
          href="/add"
          className="w-full bg-green-600 text-white text-xl font-semibold rounded-2xl flex items-center justify-center min-h-[72px] active:bg-green-700 dark:bg-green-500 dark:active:bg-green-600 transition-colors touch-manipulation"
        >
          <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Item Manually
        </Link>
      )}

      <Link
        href="/all"
        className="text-blue-600 dark:text-blue-400 text-base mt-4 py-3 px-6 active:text-blue-800 dark:active:text-blue-300 touch-manipulation"
      >
        View All Items
      </Link>

      {role === 'owner' && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          <Link
            href="/history"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
          >
            Sales History
          </Link>
          <Link
            href="/stock"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
          >
            Stock
          </Link>
          <Link
            href="/expiry"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
          >
            Expiry
          </Link>
          <Link
            href="/suppliers"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
          >
            Suppliers
          </Link>
          <Link
            href="/customers"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl text-center py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
          >
            Customers
          </Link>
        </div>
      )}
    </div>
  );
}
