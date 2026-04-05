'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase, Item } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

type ExpiryItem = Item & {
  daysUntilExpiry: number;
};

export default function ExpiryPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const [expired, setExpired] = useState<ExpiryItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ExpiryItem[]>([]);
  const [ok, setOk] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (!error && data) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in7Days = new Date(today);
      in7Days.setDate(in7Days.getDate() + 7);

      const withDays: ExpiryItem[] = data
        .filter((item) => item.expiry_date != null)
        .map((item) => {
          const expiry = new Date(item.expiry_date as string);
          const diffTime = expiry.getTime() - today.getTime();
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...item, daysUntilExpiry: days };
        });

      setExpired(withDays.filter((i) => i.daysUntilExpiry < 0).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry));
      setExpiringSoon(withDays.filter((i) => i.daysUntilExpiry >= 0 && i.daysUntilExpiry <= 7));
      setOk(withDays.filter((i) => i.daysUntilExpiry > 7).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: 0 })
      .eq('id', id);
    setRemovingId(null);
    if (!error) {
      loadItems();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
  };

  const daysLabel = (days: number) => {
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return 'Expires today';
    return `${days} day${days === 1 ? '' : 's'} left`;
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
        <h1 className="text-xl font-bold">Expiry Tracker</h1>
      </div>

      {/* Summary */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 mb-6">
          {expired.length > 0 && (
            <p className="text-red-700 dark:text-red-300 text-sm font-semibold">
              {expired.length} expired item{expired.length > 1 ? 's' : ''}
            </p>
          )}
          {expiringSoon.length > 0 && (
            <p className="text-yellow-700 dark:text-yellow-300 text-sm font-semibold">
              {expiringSoon.length} expiring within 7 days
            </p>
          )}
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

      {!loading && expired.length === 0 && expiringSoon.length === 0 && ok.length === 0 && (
        <div className="text-center py-12">
          <p className="text-green-600 dark:text-green-400 text-lg mb-2">No expiry dates tracked!</p>
          <p className="text-gray-400 text-sm">Add expiry dates to products from the Add/Edit pages.</p>
        </div>
      )}

      {/* Expired */}
      {expired.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
            Expired ({expired.length})
          </h2>
          <div className="space-y-2">
            {expired.map((item) => (
              <ExpiryRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingId === item.id}
                label="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                formatDate={formatDate}
                daysLabel={daysLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-2">
            Expiring Soon ({expiringSoon.length})
          </h2>
          <div className="space-y-2">
            {expiringSoon.map((item) => (
              <ExpiryRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingId === item.id}
                label="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400"
                formatDate={formatDate}
                daysLabel={daysLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* OK (collapsed) */}
      {ok.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 touch-manipulation"
          >
            <span>OK ({ok.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {!collapsed && (
            <div className="space-y-2">
              {ok.map((item) => (
                <ExpiryRow
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={removingId === item.id}
                  label="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                  formatDate={formatDate}
                  daysLabel={daysLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpiryRow({
  item,
  onRemove,
  isRemoving,
  label,
  formatDate,
  daysLabel,
}: {
  item: ExpiryItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
  label: string;
  formatDate: (d: string) => string;
  daysLabel: (d: number) => string;
}) {
  return (
    <div className={`${label} border rounded-xl px-4 py-3`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-base dark:text-white">{item.name}</p>
          <p className="text-sm">
            Expires: {formatDate(item.expiry_date!)} —{' '}
            <span className="font-semibold">{daysLabel(item.daysUntilExpiry)}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Stock: {item.stock_quantity ?? 0}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          disabled={isRemoving}
          className="bg-red-600 text-white text-sm font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-red-700 disabled:bg-gray-400 touch-manipulation"
        >
          {isRemoving ? '...' : 'Mark as Removed'}
        </button>
      </div>
    </div>
  );
}
