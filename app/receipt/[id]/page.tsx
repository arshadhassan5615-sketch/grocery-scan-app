'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { SHOP_NAME, VAT_RATE } from '@/lib/config';
import { generateReceiptText } from '@/lib/receipt';
import Decimal from 'decimal.js';

function ReceiptInner() {
  const params = useParams();
  const router = useRouter();
  const [txn, setTxn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data, error: err } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', params.id)
        .single();

      if (err) {
        setError('Receipt not found');
        setLoading(false);
        return;
      }
      setTxn(data);
      setLoading(false);
    };
    fetch();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!txn) return;
    const items = (txn.items as any[]).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      sell_price: item.sell_price,
      lineTotal: String(
        new Decimal((item.sell_price * item.quantity).toFixed(2)).toFixed(2)
      ),
    }));
    const date = new Date(txn.created_at).toLocaleString('en-AE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const text = generateReceiptText(
      txn.transaction_id,
      date,
      items,
      txn.subtotal,
      txn.vat_amount,
      txn.grand_total
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading receipt...</p>
      </div>
    );
  }

  if (error || !txn) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-red-500 text-lg mb-4">{error || 'Receipt not found'}</p>
          <Link href="/" className="text-blue-600 dark:text-blue-400">
            Back Home
          </Link>
        </div>
      </div>
    );
  }

  const items = txn.items as any[];
  const date = new Date(txn.created_at).toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="flex-1 px-4 pt-4 pb-8 print:px-1 print:pt-0">
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button
          onClick={() => router.push('/cart')}
          className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Receipt</h1>
      </div>

      <div id="receipt-print" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 print:max-w-[58mm] print:mx-auto print:border-none print:p-0 print:text-xs print:font-mono">

        {/* Screen version */}
        <div className="print:hidden">
          <div className="text-center mb-4">
            <p className="text-lg font-bold text-black dark:text-white">{SHOP_NAME}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{txn.transaction_id}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
          </div>
          <div className="border-t border-b border-gray-100 dark:border-gray-700 py-2 mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 text-left">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => (
                  <tr key={i} className="dark:text-white">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{parseFloat(item.sell_price).toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">{parseFloat((item.sell_price * item.quantity).toFixed(2)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>AED {txn.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>VAT ({(VAT_RATE * 100).toFixed(0)}%)</span>
              <span>AED {txn.vat_amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg dark:text-white">
              <span>Grand Total</span>
              <span>AED {txn.grand_total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">Thank you for shopping with us!</p>

          <div className="flex gap-3 mt-4 pt-4">
            <button
              onClick={handlePrint}
              className="flex-1 bg-black dark:bg-white dark:text-black text-white font-semibold rounded-xl py-3 min-h-[56px] active:bg-gray-800 dark:active:bg-gray-200 touch-manipulation"
            >
              Print Receipt
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 bg-green-600 text-white font-semibold rounded-xl py-3 min-h-[56px] active:bg-green-700 touch-manipulation"
            >
              Share on WhatsApp
            </button>
          </div>
        </div>

        {/* Print version (thermal printer friendly) */}
        <div className="hidden print:block font-mono text-xs space-y-0">
          <div className="text-center border-b border-black pb-1 mb-1">
            <p className="font-bold text-sm">{SHOP_NAME}</p>
            <p>{txn.transaction_id}</p>
            <p>{date}</p>
          </div>
          <div className="border-b border-black pb-1 mb-1">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{parseFloat((item.sell_price * item.quantity).toFixed(2)).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{txn.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT 5%</span>
              <span>{txn.vat_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{txn.grand_total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-center mt-1">Thank you for shopping with us!</p>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <ReceiptInner />
    </Suspense>
  );
}
