'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase, Supplier } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

export default function SuppliersPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setSuppliers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return (
    <div className="flex-1 px-4 pt-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Suppliers</h1>
        </div>
        <Link
          href="/suppliers/add"
          className="bg-green-600 text-white text-sm font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-green-700 touch-manipulation"
        >
          Add Supplier
        </Link>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

      {!loading && suppliers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No suppliers added yet</p>
          <Link
            href="/suppliers/add"
            className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl min-h-[56px] active:bg-green-700 touch-manipulation"
          >
            Add Your First Supplier
          </Link>
        </div>
      )}

      {!loading && suppliers.length > 0 && (
        <div className="space-y-2">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-base dark:text-white">{supplier.name}</p>
                  {supplier.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.category}</p>
                  )}
                  {supplier.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Phone: {supplier.phone}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {supplier.whatsapp && (
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 text-white text-xs font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-green-600 touch-manipulation"
                    >
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href={`/suppliers/edit/${supplier.id}`}
                    className="bg-blue-600 text-white text-xs font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-blue-700 touch-manipulation"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
