'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase, Item } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

export default function StockPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Map<string, { whatsapp?: string | null }>>(new Map());

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      const lowStock = data.filter(
        (item) => item.stock_quantity <= item.low_stock_threshold
      );
      setItems(lowStock);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadSuppliers = async () => {
      const { data } = await supabase.from('suppliers').select('id, whatsapp');
      if (data) {
        const map = new Map<string, { whatsapp?: string | null }>();
        data.forEach((s) => map.set(s.id, { whatsapp: s.whatsapp }));
        setSuppliers(map);
      }
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSave = async (id: string) => {
    const newQty = parseInt(editQty);
    if (isNaN(newQty)) return;
    setSaving(true);
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newQty })
      .eq('id', id);
    setSaving(false);
    if (!error) {
      setEditingId(null);
      setEditQty('');
      loadItems();
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
        <h1 className="text-xl font-bold">Low Stock Alerts</h1>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-green-600 dark:text-green-400 text-lg mb-2">All stock levels look good!</p>
          <p className="text-gray-400 text-sm">No items are below their threshold.</p>
        </div>
      )}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-base dark:text-white">{item.name}</p>
                  <p className="text-sm">
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Stock: {item.stock_quantity ?? 0}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {' / '}{item.low_stock_threshold ?? 5} threshold
                    </span>
                  </p>
                </div>

                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id)}
                      className="w-20 border-2 border-black dark:border-gray-400 rounded-lg px-3 py-2 text-center bg-white dark:bg-gray-800 dark:text-white min-h-[48px]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(item.id)}
                      disabled={saving}
                      className="bg-green-600 text-white font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-green-700 disabled:bg-gray-400 touch-manipulation"
                    >
                      {saving ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditQty(''); }}
                      className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-lg px-3 py-2 min-h-[48px] active:bg-gray-300 dark:active:bg-gray-600 touch-manipulation"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {item.supplier_id && suppliers.has(item.supplier_id) && suppliers.get(item.supplier_id)?.whatsapp && (
                      <a
                        href={`https://wa.me/${suppliers.get(item.supplier_id)!.whatsapp!.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, we need to restock ${item.name}. Current stock: ${item.stock_quantity ?? 0} units.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white text-sm font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-green-600 touch-manipulation"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => { setEditingId(item.id); setEditQty(String(item.stock_quantity ?? 0)); }}
                      className="bg-blue-600 text-white text-sm font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-blue-700 touch-manipulation"
                    >
                      Update
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
