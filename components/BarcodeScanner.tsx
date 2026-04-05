'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.CODE_128,
];

export default function BarcodeScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleManualSubmit = () => {
    const barcode = manualBarcode.trim();
    if (barcode) {
      router.push(`/item/${encodeURIComponent(barcode)}`);
    }
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  useEffect(() => {
    // Only start after component is mounted on the client
    if (!mountedRef.current) return;

    const container = document.getElementById('scanner-container');
    if (!container) return;

    let cancelled = false;

    const start = async () => {
      const scanner = new Html5Qrcode('scanner-container', {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          if (!cancelled) setError('No cameras found');
          return;
        }

        const cameraId = devices.find((d) =>
          d.label.toLowerCase().includes('back')
        )?.id || devices[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
          },
          async (decodedText) => {
            if (scannerRef.current !== scanner) return;
            scannerRef.current = null;

            // Stop & clear camera in background
            scanner.stop().then(() => scanner.clear()).catch(() => {});

            if (!cancelled) setLoading(true);

            try {
              const { data: item } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', decodedText)
                .single();

              if (item) {
                router.push(`/item/${encodeURIComponent(decodedText)}`);
              } else {
                router.push(
                  `/add?barcode=${encodeURIComponent(decodedText)}&mode=scan`
                );
              }
            } catch {
              router.push(
                `/add?barcode=${encodeURIComponent(decodedText)}&mode=scan`
              );
            } finally {
              if (!cancelled) setLoading(false);
            }
          },
          () => {} // Ignore decode errors (normal when no barcode in view)
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to start camera');
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 bg-black flex flex-col">
      {!mounted || loading ? (
        <div className="flex-1 flex items-center justify-center bg-black/80 z-50">
          <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white p-6 text-center">
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold min-h-[56px]"
          >
            Go Back Home
          </button>
        </div>
      ) : (
        <div id="scanner-container" className="flex-1" />
      )}
      <div className="p-4 bg-black flex items-center gap-2">
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          onKeyDown={handleManualKeyDown}
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
