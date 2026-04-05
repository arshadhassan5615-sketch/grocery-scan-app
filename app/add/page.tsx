'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AddItemPage() {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [threshold, setThreshold] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [supplierId, setSupplierId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBarcode = !!barcode;

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const b = sp.get('barcode');
    if (b) setBarcode(b);
    const n = sp.get('name');
    if (n) setName(n);
    setIsOwner(sessionStorage.getItem('grocery-role') === 'owner');

    // Fetch suppliers for dropdown
    const fetchSuppliers = async () => {
      const { data } = await supabase.from('suppliers').select('id, name').order('name', { ascending: true });
      if (data) setSuppliers(data);
    };
    fetchSuppliers();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !buyPrice || !sellPrice) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    const insertData: any = {
      name: name.trim(),
      barcode: barcode || null,
      buy_price: parseFloat(buyPrice).toFixed(2),
      sell_price: parseFloat(sellPrice).toFixed(2),
      stock_quantity: parseInt(stockQty) || 0,
      low_stock_threshold: parseInt(threshold) || 5,
      expiry_date: expiryDate || null,
      supplier_id: supplierId || null,
    };

    const { data, error: err } = await supabase
      .from('products')
      .insert(insertData)
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
            Barcode {'(scanned)'}
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="1234567890"
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
                placeholder="0"
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
                placeholder="5"
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

        {isOwner && (
          <div>
            <label className="block text-sm font-semibold mb-2">
              Supplier {'(optional)'}
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
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
