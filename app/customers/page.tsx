'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase, Customer } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

export default function CustomersPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debtTotals, setDebtTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [overallTotal, setOverallTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setCustomers(data);

      // Get total debt per customer
      const { data: debts } = await supabase
        .from('debts')
        .select('customer_id, amount, is_paid');

      const totalsMap = new Map<string, number>();
      let total = 0;

      if (debts) {
        const unpaidByCustomer = new Map<string, number>();
        for (const d of debts) {
          if (!d.is_paid) {
            const existing = unpaidByCustomer.get(d.customer_id) || 0;
            unpaidByCustomer.set(d.customer_id, existing + d.amount);
          }
        }
        for (const c of data) {
          const cTotal = unpaidByCustomer.get(c.id) || 0;
          totalsMap.set(c.id, cTotal);
          total += cTotal;
        }
      }

      setDebtTotals(totalsMap);
      setOverallTotal(total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sort by highest debt first
  const sorted = [...customers].sort((a, b) => {
    return (debtTotals.get(b.id) || 0) - (debtTotals.get(a.id) || 0);
  });

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
          <h1 className="text-xl font-bold">Customer Tabs</h1>
        </div>
        <Link
          href="/customers/add"
          className="bg-green-600 text-white text-sm font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-green-700 touch-manipulation"
        >
          Add Customer
        </Link>
      </div>

      {/* Overall total */}
      {overallTotal > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm font-semibold">
            Total outstanding: AED {overallTotal.toFixed(2)}
          </p>
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

      {!loading && customers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No customers added yet</p>
          <Link
            href="/customers/add"
            className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl min-h-[56px] active:bg-green-700 touch-manipulation"
          >
            Add Your First Customer
          </Link>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((customer) => {
            const owed = debtTotals.get(customer.id) || 0;
            const hasDebt = owed > 0;

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-base dark:text-white">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Phone: {customer.phone}
                      </p>
                    )}
                    <p
                      className={`text-sm font-bold ${
                        hasDebt ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {hasDebt ? `Owes: AED ${owed.toFixed(2)}` : 'Balance settled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {hasDebt && customer.whatsapp && (
                      <a
                        href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hi ${customer.name}, your current balance at our shop is AED ${owed.toFixed(2)}. Please settle when convenient. Thank you.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white text-xs font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-green-600 touch-manipulation whitespace-nowrap"
                      >
                        Reminder
                      </a>
                    )}
                    <Link
                      href={`/customers/${customer.id}`}
                      className="bg-blue-600 text-white text-xs font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-blue-700 touch-manipulation"
                    >
                      View Tab
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
