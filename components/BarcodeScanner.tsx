'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function BarcodeScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('scanner-container');
    scannerRef.current = scanner;

    const start = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setError('No cameras found');
          return;
        }

        // Prefer back camera
        const cameraId = devices.find((d) =>
          d.label.toLowerCase().includes('back')
        )?.id || devices[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (hasScanned) return;
            setHasScanned(true);
            // Navigate immediately and stop scanner
            try {
              scanner.clear();
            } catch {}
            router.push(`/item/${encodeURIComponent(decodedText)}`);
          },
          () => {} // Ignore scan errors (normal when scanning)
        );
      } catch (err: any) {
        setError(err?.message || 'Failed to start camera');
      }
    };

    start();

    return () => {
      try {
        scanner.clear();
      } catch {}
    };
  }, [router, hasScanned]);

  return (
    <div className="flex-1 bg-black flex flex-col">
      {error ? (
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
    </div>
  );
}
