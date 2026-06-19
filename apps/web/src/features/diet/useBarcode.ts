/**
 * Barcode scanning via the native browser BarcodeDetector API (Chrome 83+, Edge 83+).
 * No npm package required.
 *
 * Usage:
 *   const { videoRef, scanning, error, lastBarcode } = useBarcode(onDetected);
 *   - Mount <video ref={videoRef} autoPlay playsInline muted />
 *   - Call start() to open camera, stop() to close it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// BarcodeDetector is not yet in lib.dom.d.ts — declare it ourselves
declare global {
  interface Window {
    BarcodeDetector?: {
      new(options?: { formats?: string[] }): {
        detect(source: HTMLVideoElement | ImageBitmap): Promise<Array<{ rawValue: string; format: string }>>;
      };
      getSupportedFormats?(): Promise<string[]>;
    };
  }
}

export function useBarcode(onDetected: (barcode: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<NonNullable<Window['BarcodeDetector']>> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScanning(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setLastBarcode(null);

    if (!window.BarcodeDetector) {
      setError('Twoja przeglądarka nie obsługuje skanera kodów (BarcodeDetector). Użyj Chrome 83+ lub Edge 83+.');
      return;
    }

    try {
      if (!detectorRef.current) {
        detectorRef.current = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);

      const tick = async () => {
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (!video || !detector || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const results = await detector.detect(video);
          if (results.length > 0) {
            const code = results[0].rawValue;
            setLastBarcode(code);
            onDetectedRef.current(code);
            stop();
            return;
          }
        } catch {
          // detection frame failed — keep scanning
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie można uzyskać dostępu do kamery');
      stop();
    }
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { videoRef, scanning, error, lastBarcode, start, stop };
}
