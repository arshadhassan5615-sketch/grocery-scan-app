'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [stockQty, setStockQty] = useState('');
  const [threshold, setThreshold] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (err) {
        setError('Item not found');
        setLoading(false);
        return;
      }

      setName(data.name);
      setBarcode(data.barcode || '');
      setBuyPrice(data.buy_price);
      setSellPrice(data.sell_price);
      setStockQty(String(data.stock_quantity ?? 0));
      setThreshold(String(data.low_stock_threshold ?? 5));
      setExpiryDate(data.expiry_date || '');
      setIsOwner(sessionStorage.getItem('grocery-role') === 'owner');
      setLoading(false);
    };

    fetchItem();
  }, [params.id]);

  const handleSave = async () => {
    if (!name.trim() || !buyPrice || !sellPrice) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      barcode: barcode || null,
      buy_price: parseFloat(buyPrice).toFixed(2),
      sell_price: parseFloat(sellPrice).toFixed(2),
    };
    if (isOwner) {
      updatePayload.stock_quantity = parseInt(stockQty) || 0;
      updatePayload.low_stock_threshold = parseInt(threshold) || 5;
      updatePayload.expiry_date = expiryDate || null;
    }

    const { error: err } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', params.id);

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push(`/item/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/item/${params.id}`}
          className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Edit Item</h1>
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
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Barcode</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
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
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        {isOwner && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>
        )}

        {isOwner && (
          <div>
            <label className="block text-sm font-semibold mb-2">
              Expiry Date {'(optional)'}
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black dark:bg-white dark:text-black text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-6 active:bg-gray-800 dark:active:bg-gray-200 disabled:bg-gray-400 touch-manipulation"
      >
        {saving ? 'Saving...' : 'Update Item'}
      </button>
    </div>
  );
}
