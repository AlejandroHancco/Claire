'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, 400, 400,
  );

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.85,
    ),
  );
}

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [visible, setVisible] = useState(false);

  // Slide-up entrance animation
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const onCropComplete = useCallback((_: Area, cap: Area) => {
    setCroppedAreaPixels(cap);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setProcessing(false);
    }
  };

  const translateY = visible ? '0' : '100%';
  const transition = 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onCancel}
      />

      {/* Sheet — aligned to 390px column, same as BottomSheet */}
      <div
        className="fixed bottom-0 z-50 glass-sheet rounded-t-[28px] flex flex-col"
        style={{
          left: 'max(0px, calc(50vw - 195px))',
          width: 'min(390px, 100vw)',
          transform: `translateY(${translateY})`,
          transition,
          opacity: visible ? 1 : 0,
          willChange: 'transform',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-9 h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} />
        </div>

        {/* Title row */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
          <h2 className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>Recortar foto</h2>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-full flex items-center justify-center press"
            style={{ background: 'rgba(255,255,255,0.10)' }}
            aria-label="Cancelar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop viewport — fixed 300px height, edge-to-edge */}
        <div className="relative flex-shrink-0" style={{ height: 300, overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex-shrink-0 px-5 pt-5 pb-2 flex items-center gap-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'rgba(245,245,255,0.35)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: '#A78BFA' }}
            aria-label="Zoom"
          />
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: 'rgba(245,245,255,0.35)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>

        <p className="flex-shrink-0 text-center text-[12px] pb-1"
          style={{ color: 'rgba(245,245,255,0.30)' }}>
          Arrastra para reposicionar · Pellizca o desliza para hacer zoom
        </p>

        {/* Buttons */}
        <div className="flex-shrink-0 px-5 pt-3 pb-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 h-12 rounded-full text-[15px] font-semibold press"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(245,245,255,0.70)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="flex-1 h-12 rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
            style={{ background: processing ? 'rgba(167,139,250,0.50)' : '#A78BFA', transition: 'background 200ms' }}
          >
            {processing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : 'Usar foto'}
          </button>
        </div>
      </div>
    </>
  );
}
