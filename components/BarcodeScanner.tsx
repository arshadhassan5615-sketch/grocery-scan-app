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

    // Catch any errors that escape normal try/catch
    const onWindowError = (msg: string | Event, _src?: string, _line?: number, _col?: number, err?: Error | null) => {
      const text = typeof msg === 'string' ? msg : 'Window error';
      const stack = err ? String(err.stack) : '';
      setError(text + (stack ? ' | ' + stack : ''));
      return true;
    };
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      setError('Unhandled: ' + String(e.reason));
    };

    window.addEventListener('error', onWindowError as any);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('error', onWindowError as any);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const handleManualSubmit = () => {
    try {
      const barcode = manualBarcode.trim();
      if (barcode) {
        router.push(`/item/${encodeURIComponent(barcode)}`);
      }
    } catch (err: any) {
      setError('Manual submit error: ' + String(err?.message || err));
    }
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  useEffect(() => {
    if (!mountedRef.current) return;

    const container = document.getElementById('scanner-container');
    if (!container) return;

    let cancelled = false;

    const start = async () => {
      try {
        console.error('[Scanner] start() called');

        console.error('[Scanner] Creating Html5Qrcode instance');
        const scanner = new Html5Qrcode('scanner-container', {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
        });
        scannerRef.current = scanner;
        console.error('[Scanner] Instance created');

        console.error('[Scanner] Requesting cameras...');
        const devices = await Html5Qrcode.getCameras();
        console.error('[Scanner] Cameras found:', devices?.length || 0);

        if (!devices || devices.length === 0) {
          if (!cancelled) setError('No cameras found');
          return;
        }

        const cameraId = devices.find((d) =>
          d.label.toLowerCase().includes('back')
        )?.id || devices[0].id;
        console.error('[Scanner] Selected camera ID:', cameraId);

        console.error('[Scanner] Starting scanner...');
        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
          },
          async (decodedText) => {
            try {
              console.error('[Scanner] Decoded:', decodedText);
              if (scannerRef.current !== scanner) return;
              scannerRef.current = null;

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
            } catch (err: any) {
              console.error('[Scanner] Decode callback error:', err);
              if (!cancelled) setError('Decode error: ' + String(err?.message || err));
            }
          },
          () => {} // Ignore scan errors (normal when no barcode in view)
        );
        console.error('[Scanner] Scanner started successfully');
      } catch (err: any) {
        console.error('[Scanner] start() caught error:', err);
        if (!cancelled) setError('Start error: ' + String(err?.message || err));
      }
    };

    start();

    return () => {
      console.error('[Scanner] Cleanup called');
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().then(() => s.clear()).catch((e: any) => {
          console.error('[Scanner] Cleanup stop error:', e);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 bg-black flex flex-col">
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center text-black">
          <p className="text-lg font-bold mb-2 text-red-600">Scanner Error</p>
          <p className="text-sm text-gray-800 mb-4 break-all whitespace-pre-wrap">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold min-h-[56px]"
          >
            Go Back Home
          </button>
        </div>
      ) : !mounted || loading ? (
        <div className="flex-1 flex items-center justify-center bg-black/80 z-50">
          <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
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
