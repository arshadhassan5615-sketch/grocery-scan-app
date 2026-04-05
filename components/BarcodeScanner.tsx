'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat, NotFoundException } from '@zxing/library';
import type { Result } from '@zxing/library';
import { supabase } from '@/lib/supabase';

const hints = new Map<DecodeHintType | number, unknown>();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

export default function BarcodeScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const handleBarcode = useCallback(async (result: Result) => {
    const text = result.getText();
    if (!text) return;
    scannedRef.current = true;
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
  }, [router]);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader(hints);
    readerRef.current = codeReader;

    const start = async () => {
      try {
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          async (result, err, controls) => {
            if (result) {
              controls.stop();
              await handleBarcode(result);
              return;
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
      scannedRef.current = true;
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [handleBarcode]);

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
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Viewfinder border */}
            <div className="absolute inset-0 border-[2px] border-white/60 rounded-lg" />
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
            {/* Scanning line animation */}
            <div className="absolute left-2 right-2 h-0.5 bg-green-400 animate-bounce top-1/2" />
          </div>
          <p className="absolute bottom-32 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            Point at barcode to scan
          </p>
        </div>
      </div>
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
