import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ScanLine } from 'lucide-react';

// True on Android Chrome / recent Chromium; the scan button should be hidden
// entirely when this is false (e.g. iOS Safari has no BarcodeDetector).
export const isBarcodeScanSupported = () =>
    typeof window !== 'undefined' && 'BarcodeDetector' in window;

/**
 * Full-screen camera barcode scanner built on the native BarcodeDetector API.
 * Calls onDetect(code) once with the first code found, then the parent closes it.
 */
const BarcodeScannerModal = ({ isOpen, onClose, onDetect, title }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState('');

    // Keep the latest callback in a ref: onDetect gets a new identity on every
    // parent render (e.g. the billing clock ticks each minute), and having it
    // in the camera effect's deps would tear down and re-acquire the stream
    // mid-scan.
    const onDetectRef = useRef(onDetect);
    useEffect(() => { onDetectRef.current = onDetect; }, [onDetect]);

    useEffect(() => {
        if (!isOpen) return;

        let stream = null;
        let cancelled = false;
        let rafId = 0;
        let lastScan = 0;

        const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
        });

        const tick = async () => {
            if (cancelled) return;
            const video = videoRef.current;
            const now = performance.now();
            // Detection every ~150ms is plenty and keeps the phone cool.
            if (video && video.readyState >= 2 && now - lastScan > 150) {
                lastScan = now;
                try {
                    const codes = await detector.detect(video);
                    if (!cancelled && codes.length > 0 && codes[0].rawValue) {
                        if (navigator.vibrate) navigator.vibrate(80);
                        onDetectRef.current(codes[0].rawValue);
                        return; // parent closes the modal — stop the loop
                    }
                } catch { /* detector hiccup on a frame — keep scanning */ }
            }
            rafId = requestAnimationFrame(tick);
        };

        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        }).then((s) => {
            if (cancelled) {
                s.getTracks().forEach(tr => tr.stop());
                return;
            }
            stream = s;
            if (videoRef.current) {
                videoRef.current.srcObject = s;
                videoRef.current.play().catch(() => { });
            }
            rafId = requestAnimationFrame(tick);
        }).catch(() => {
            setError('camera');
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
            if (stream) stream.getTracks().forEach(tr => tr.stop());
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 shrink-0">
                <div className="flex items-center gap-2 text-white">
                    <ScanLine className="h-5 w-5 text-[var(--color-primary)]" />
                    <span className="text-sm font-black uppercase tracking-widest">{title}</span>
                </div>
                <button
                    onClick={onClose}
                    className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform"
                    aria-label="Close scanner"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Camera viewport */}
            <div className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                        <p className="text-white/80 text-sm font-semibold">
                            Camera unavailable. Allow camera access in your browser settings and try again.
                        </p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        {/* Aiming frame */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[78%] max-w-sm aspect-[3/2] rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative overflow-hidden">
                                <div className="absolute left-0 right-0 h-0.5 bg-[var(--color-primary)] animate-scanline" />
                            </div>
                        </div>
                        <style>{`
                            @keyframes scanline { 0% { top: 8%; } 50% { top: 88%; } 100% { top: 8%; } }
                            .animate-scanline { animation: scanline 2.2s ease-in-out infinite; }
                            @media (prefers-reduced-motion: reduce) { .animate-scanline { animation: none; top: 50%; } }
                        `}</style>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default BarcodeScannerModal;
