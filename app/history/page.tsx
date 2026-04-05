'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';
import Decimal from 'decimal.js';

type Txn = {
  id: string;
  transaction_id: string;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    sell_price: number;
    lineTotal: number;
  }>;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  total_profit: number;
};

type FilterType = 'today' | 'week' | 'month' | 'all';

function getDateRange(filter: FilterType): [string, string] {
  const now = new Date();
  if (filter === 'all') return ['', ''];

  let start: Date;
  if (filter === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === 'week') {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else {
    start = new Date(now);
    start.setMonth(start.getMonth() - 1);
  }
  return [start.toISOString(), now.toISOString()];
}

export default function HistoryPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('transactions').select('*');

    const [start, end] = getDateRange(filter);
    if (start) query = query.gte('created_at', start);
    if (end) query = query.lte('created_at', end);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

    if (data && !error) {
      setTxns(data as any[]);
    } else {
      setTxns([]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Summary stats
  const totalRevenue = txns.reduce((s, t) => new Decimal(s).plus(t.grand_total), new Decimal(0)).toFixed(2);
  const totalProfit = txns.reduce((s, t) => new Decimal(s).plus(t.total_profit), new Decimal(0)).toFixed(2);
  const txnCount = txns.length;

  // Top selling items
  const itemCounts: Record<string, { name: string; qty: number }> = {};
  for (const txn of txns) {
    if (Array.isArray(txn.items)) {
      for (const item of txn.items) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { name: item.name, qty: 0 };
        }
        itemCounts[item.name].qty += item.quantity;
      }
    }
  }
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

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
        <h1 className="text-xl font-bold">Sales History</h1>
      </div>

      {/* Summary bar */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Revenue</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">AED {totalRevenue}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Profit</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">AED {totalProfit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Orders</p>
            <p className="text-lg font-bold text-black dark:text-white">{txnCount}</p>
          </div>
        </div>

        {topItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">Top 5 Selling Items</p>
            {topItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm dark:text-white py-0.5">
                <span className="truncate pr-2">{i + 1}. {item.name}</span>
                <span className="text-gray-500 dark:text-gray-400 tabular-nums">{item.qty} sold</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'today', 'week', 'month'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap text-sm font-semibold rounded-xl px-4 py-2 min-h-[40px] touch-manipulation ${
              filter === f
                ? 'bg-black dark:bg-white dark:text-black text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {loading && <p className="text-center text-gray-400 py-8">Loading transactions...</p>}
      {!loading && txns.length === 0 && (
        <p className="text-center text-gray-400 py-8">No transactions found</p>
      )}
      {!loading && txns.length > 0 && (
        <div className="space-y-2">
          {txns.map((txn) => (
            <button
              key={txn.id}
              onClick={() => router.push(`/receipt/${txn.id}`)}
              className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 min-h-[64px] active:bg-gray-50 dark:active:bg-gray-800 touch-manipulation"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm dark:text-white font-mono">{txn.transaction_id}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(txn.created_at).toLocaleString('en-AE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 dark:text-green-400">
                    AED {parseFloat(txn.grand_total.toString()).toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Profit: AED {parseFloat(txn.total_profit.toString()).toFixed(2)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
