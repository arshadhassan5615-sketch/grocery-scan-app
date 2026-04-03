'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Item } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PAGE_SIZE = 20;

export default function AllItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = useCallback(async (pageNum: number) => {
    setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true })
      .range(from, to);

    if (!error && data) {
      setItems(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems(page);
  }, [page, loadItems]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

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
        <h1 className="text-xl font-bold">All Items ({items.length})</h1>
      </div>

      {loading && (
        <p className="text-center text-gray-400 py-8">Loading items...</p>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No items yet</p>
          <Link
            href="/scan"
            className="inline-block bg-black dark:bg-white dark:text-black text-white font-semibold px-6 py-3 rounded-xl min-h-[56px]"
          >
            Scan Your First Item
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[64px] px-4 touch-manipulation"
              >
                <button
                  onClick={() => router.push(`/item/${item.id}`)}
                  className="flex-1 text-left py-3 pr-2 active:bg-gray-50 dark:active:bg-gray-800 rounded-xl"
                >
                  <p className="font-medium text-base truncate dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cost: ${parseFloat(item.buy_price).toFixed(2)}
                  </p>
                </button>
                <span className="text-green-600 dark:text-green-400 font-bold text-lg whitespace-nowrap mr-2">
                  ${parseFloat(item.sell_price).toFixed(2)}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-3 min-w-[48px] min-h-[48px] flex items-center justify-center text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/30 rounded-xl touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-400 text-black dark:text-white font-semibold px-6 py-3 rounded-xl min-h-[56px] disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
            >
              Previous
            </button>
            <span className="text-gray-500 dark:text-gray-400">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="bg-black dark:bg-white dark:text-black text-white font-semibold px-6 py-3 rounded-xl min-h-[56px] disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
