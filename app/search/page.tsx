'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase, Item } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(20);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleAddNew = () => {
    if (query.trim()) {
      router.push(`/add?name=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="flex-1 px-4 pt-4">
      <div className="sticky top-0 bg-white dark:bg-gray-900 pb-4 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/"
            className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search item name..."
            className="flex-1 border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500 dark:focus:border-gray-500 touch-manipulation"
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <p className="text-center text-gray-400 py-8">Searching...</p>
      )}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No items found for &quot;{query}&quot;</p>
          <button
            onClick={handleAddNew}
            className="bg-black dark:bg-white dark:text-black text-white font-semibold px-6 py-4 rounded-xl min-h-[56px] min-w-[200px] active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
          >
            Add &quot;{query}&quot; as new item
          </button>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2 pb-4">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                router.push(`/item/${item.id}`)
              }
              className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 min-h-[64px] active:bg-gray-50 dark:active:bg-gray-800 flex justify-between items-center touch-manipulation"
            >
              <span className="font-medium text-base truncate pr-2">
                {item.name}
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg whitespace-nowrap">
                ${parseFloat(item.sell_price).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
