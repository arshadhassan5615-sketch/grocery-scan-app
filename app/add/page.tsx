'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function AddItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get('name') || '');
  const [barcode, setBarcode] = useState(searchParams.get('barcode') || '');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBarcode = !!barcode;

  const handleSave = async () => {
    if (!name.trim() || !buyPrice || !sellPrice) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('items')
      .insert({
        name: name.trim(),
        barcode: hasBarcode ? barcode : null,
        buy_price: parseFloat(buyPrice).toFixed(2),
        sell_price: parseFloat(sellPrice).toFixed(2),
      })
      .select()
      .single();

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push(`/item/${data.id}`);
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
        <h1 className="text-xl font-bold">Add New Item</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Coca-Cola 500ml"
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Barcode {hasBarcode ? '(scanned)' : ''}
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="1234567890"
            disabled={hasBarcode}
            className="w-full border-2 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Buy Price (Cost) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="0.00"
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Sell Price (Customer Price) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="0.00"
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-green-600 text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-6 active:bg-green-700 disabled:bg-gray-400 touch-manipulation"
      >
        {saving ? 'Saving...' : 'Save Item'}
      </button>
    </div>
  );
}

export default function AddItemPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p>Loading...</p></div>}>
      <AddItemForm />
    </Suspense>
  );
}
