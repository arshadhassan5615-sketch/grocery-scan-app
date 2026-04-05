'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { usePinGuard, useInactivityTimeout } from '@/components/PinGuard';

export default function EditSupplierPage() {
  usePinGuard('owner');
  useInactivityTimeout();
  const params = useParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      const { data, error: err } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', params.id)
        .single();

      if (err) {
        setError('Supplier not found');
        setLoading(false);
        return;
      }

      setName(data.name);
      setCategory(data.category || '');
      setPhone(data.phone || '');
      setWhatsapp(data.whatsapp || '');
      setNotes(data.notes || '');
      setLoading(false);
    };

    fetchSupplier();
  }, [params.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Supplier name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from('suppliers')
      .update({
        name: name.trim(),
        category: category.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        notes: notes.trim() || null,
      })
      .eq('id', params.id);

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    router.push('/suppliers');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this supplier? Existing products will keep the supplier link.')) return;

    const { error: err } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', params.id);

    if (!err) {
      router.push('/suppliers');
    }
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
          href="/suppliers"
          className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 rounded-xl touch-manipulation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">Edit Supplier</h1>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Supplier Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-black dark:border-gray-400 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Category {'(optional)'}
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Phone Number {'(optional)'}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            WhatsApp Number {'(optional)'}
          </label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="971501234567 — include country code, no +"
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Notes {'(optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-lg min-h-[56px] bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-500 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black dark:bg-white dark:text-black text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-6 active:bg-gray-800 dark:active:bg-gray-200 disabled:bg-gray-400 touch-manipulation"
      >
        {saving ? 'Saving...' : 'Update Supplier'}
      </button>

      <button
        onClick={handleDelete}
        className="w-full bg-red-600 text-white font-bold text-lg rounded-2xl py-4 min-h-[64px] mt-3 active:bg-red-700 touch-manipulation"
      >
        Delete Supplier
      </button>
    </div>
  );
}
