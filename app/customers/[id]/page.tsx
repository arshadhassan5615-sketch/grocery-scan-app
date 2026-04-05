'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Customer, Debt } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

export default function CustomerDetailPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [debtDesc, setDebtDesc] = useState('');
  const [debtAmt, setDebtAmt] = useState('');
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: custData, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (custErr || !custData) {
      setLoading(false);
      return;
    }

    setCustomer(custData);

    const { data: debtData } = await supabase
      .from('debts')
      .select('*')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false });

    if (debtData) setDebts(debtData);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDebt = async () => {
    if (!debtDesc.trim() || !debtAmt || parseFloat(debtAmt) <= 0) return;

    setSaving(true);
    const { error } = await supabase
      .from('debts')
      .insert({
        customer_id: params.id,
        description: debtDesc.trim(),
        amount: parseFloat(parseFloat(debtAmt).toFixed(2)),
        is_paid: false,
      });
    setSaving(false);

    if (!error) {
      setDebtDesc('');
      setDebtAmt('');
      setShowForm(false);
      loadData();
    }
  };

  const handleMarkPaid = async (debtId: string) => {
    setPayingId(debtId);
    const { error } = await supabase
      .from('debts')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', debtId);
    setPayingId(null);

    if (!error) loadData();
  };

  const handleMarkAllPaid = async () => {
    if (!confirm('Mark all unpaid debts as settled?')) return;
    const unpaidIds = debts.filter((d) => !d.is_paid).map((d) => d.id);
    if (unpaidIds.length === 0) return;

    await supabase
      .from('debts')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .in('id', unpaidIds);
    loadData();
  };

  const totalOutstanding = debts
    .filter((d) => !d.is_paid)
    .reduce((sum, d) => sum + d.amount, 0);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Customer not found</p>
        <Link href="/customers" className="text-blue-600 active:text-blue-800">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/customers"
          className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">{customer.name}</h1>
      </div>

      {/* Customer info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1">
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="text-sm text-blue-600 dark:text-blue-400 underline">
                📞 {customer.phone}
              </a>
            )}
            {customer.whatsapp && (
              <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp: {customer.whatsapp}</p>
            )}
            {customer.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customer.notes}</p>
            )}
          </div>
          {debts.filter((d) => !d.is_paid).length > 0 && (
            <button
              onClick={handleMarkAllPaid}
              className="bg-green-600 text-white text-xs font-semibold rounded-lg px-4 py-2 min-h-[48px] active:bg-green-700 touch-manipulation whitespace-nowrap"
            >
              Mark All Paid
            </button>
          )}
        </div>
      </div>

      {/* Total balance */}
      <div className={`border rounded-xl px-4 py-4 mb-4 ${
        totalOutstanding > 0
          ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
      }`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
        <p className={`text-3xl font-bold ${
          totalOutstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}>
          AED {totalOutstanding.toFixed(2)}
        </p>
      </div>

      {/* WhatsApp button */}
      {totalOutstanding > 0 && customer.whatsapp && (
        <a
          href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `Hi ${customer.name}, your current balance at our shop is AED ${totalOutstanding.toFixed(2)}. Please settle when convenient. Thank you.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-500 text-white text-center font-semibold rounded-2xl py-4 min-h-[64px] mb-4 active:bg-green-600 touch-manipulation"
        >
          Send Balance on WhatsApp
        </a>
      )}

      {/* Add to Tab button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-black dark:bg-white dark:text-black text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mb-4 active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
        >
          Add to Tab
        </button>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold">New Debt Entry</p>
          <input
            type="text"
            value={debtDesc}
            onChange={(e) => setDebtDesc(e.target.value)}
            placeholder="e.g. Groceries 5 Apr"
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
          <input
            type="number"
            step="0.01"
            value={debtAmt}
            onChange={(e) => setDebtAmt(e.target.value)}
            placeholder="Amount in AED"
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddDebt}
              disabled={saving}
              className="flex-1 bg-green-600 text-white font-semibold rounded-xl py-3 min-h-[56px] active:bg-green-700 disabled:bg-gray-400 touch-manipulation"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowForm(false); setDebtDesc(''); setDebtAmt(''); }}
              className="bg-gray-200 dark:bg-gray-700 font-semibold rounded-xl px-4 py-3 min-h-[56px] active:bg-gray-300 dark:active:bg-gray-600 touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit customer */}
      <Link
        href={`/customers/edit/${customer.id}`}
        className="block w-full text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 mb-6 min-h-[48px] touch-manipulation"
      >
        Edit Customer
      </Link>

      {/* Debt entries */}
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        History ({debts.length})
      </h2>

      {debts.length === 0 && (
        <p className="text-center text-gray-400 py-8">No tab entries yet</p>
      )}

      <div className="space-y-2">
        {debts.map((debt) => (
          <div
            key={debt.id}
            className={`border rounded-xl px-4 py-3 ${
              debt.is_paid
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-base dark:text-white">{debt.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(debt.created_at)}</p>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right">
                  <p className={`font-bold ${
                    debt.is_paid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    AED {debt.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs font-semibold ${
                    debt.is_paid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {debt.is_paid ? `Paid ${formatDate(debt.paid_at!)}` : 'Unpaid'}
                  </p>
                </div>
                {!debt.is_paid && (
                  <button
                    onClick={() => handleMarkPaid(debt.id)}
                    disabled={payingId === debt.id}
                    className="bg-green-600 text-white text-xs font-semibold rounded-lg px-3 py-2 min-h-[48px] active:bg-green-700 disabled:bg-gray-400 touch-manipulation whitespace-nowrap"
                  >
                    {payingId === debt.id ? '...' : 'Mark as Paid'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
