'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { supabase } from '@/lib/supabase';

export default function BarcodeScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    const start = async () => {
      try {
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          async (result, err) => {
            if (result && !scanned) {
              setScanned(true);
              const text = result.getText();
              setLoading(true);
              try {
                const { data: item } = await supabase
                  .from('products')
                  .select('*')
                  .eq('barcode', text)
                  .single();
                if (item) {
                  router.push('/item/' + item.id);
                } else {
                  router.push('/add?barcode=' + encodeURIComponent(text) + '&mode=scan');
                }
              } finally {
                setLoading(false);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              // ignore normal not-found errors during scanning
            }
          }
        );
      } catch (e: any) {
        setError(e?.message || 'Camera failed to start');
      }
    };

    start();

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, []);

  const handleManualSubmit = async () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;
    setLoading(true);
    try {
      const { data: item } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();
      if (item) {
        router.push('/item/' + item.id);
      } else {
        router.push('/add?barcode=' + encodeURIComponent(barcode) + '&mode=scan');
      }
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center
        text-white bg-black p-6 text-center">
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => router.push('/')}
          className="bg-white text-black px-6 py-3 rounded-xl">
          Go Back Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="h-10 w-10 border-4 border-white
          border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-black flex flex-col">
      <video ref={videoRef} className="flex-1 w-full object-cover" />
      <div className="p-4 bg-black flex items-center gap-2">
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleManualSubmit(); } }}
          placeholder="Enter barcode manually & press Enter..."
          className="flex-1 border-2 rounded-xl px-4 py-3 text-lg bg-gray-900 text-white border-gray-600 focus:outline-none focus:border-gray-400 min-h-[56px] touch-manipulation"
          autoComplete="off"
        />
        <button
          onClick={handleManualSubmit}
          disabled={!manualBarcode.trim()}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl min-h-[56px] active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
        >
          Go
        </button>
      </div>
    </div>
  );
}
