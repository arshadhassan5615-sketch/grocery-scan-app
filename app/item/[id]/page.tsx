'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';

export default function ItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const id = params.id as string;

      let { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (err) {
        const decoded = decodeURIComponent(id);
        const result = await supabase
          .from('products')
          .select('*')
          .eq('barcode', decoded)
          .single();

        if (result.data) {
          data = result.data;
        } else {
          router.replace(
            `/add?barcode=${encodeURIComponent(decoded)}&mode=scan`
          );
          return;
        }
      }

      setItem(data);
      setLoading(false);
    };

    fetchItem();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">{error || 'Item not found'}</p>
      </div>
    );
  }

  const buyP = parseFloat(item.buy_price);
  const sellP = parseFloat(item.sell_price);
  const margin = (sellP - buyP).toFixed(2);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center w-full">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2 break-words">
          {item.name}
        </h1>
        {item.barcode && (
          <p className="text-xs text-gray-400 font-mono mb-6">
            {item.barcode}
          </p>
        )}
      </div>

      <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 space-y-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Cost
          </p>
          <p className="text-4xl text-blue-600 dark:text-blue-400 font-semibold">
            AED {buyP.toFixed(2)}
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Price
          </p>
          <p className="text-5xl text-green-600 dark:text-green-400 font-extrabold">
            AED {sellP.toFixed(2)}
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Margin:{' '}
            <span className="text-gray-700 dark:text-gray-300 font-semibold">
              AED {margin}
            </span>
          </p>
        </div>
      </div>

      <div className="w-full space-y-3 mt-4">
        <AddToCartButton
          item={{
            id: item.id,
            name: item.name,
            buy_price: buyP,
            sell_price: sellP,
          }}
        />
        <Link
          href={`/edit/${item.id}`}
          className="block w-full bg-black dark:bg-white dark:text-black text-white text-center text-lg font-semibold rounded-2xl py-4 min-h-[64px] active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
        >
          Edit Item
        </Link>
        <button
          onClick={() => router.push('/scan')}
          className="block w-full bg-white dark:bg-gray-800 text-black dark:text-white text-lg font-semibold rounded-2xl border-2 border-black dark:border-gray-400 py-4 min-h-[64px] active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
        >
          Scan Another
        </button>
      </div>
    </div>
  );
}
