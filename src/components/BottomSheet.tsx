'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapHeight?: string;
}

export default function BottomSheet({ isOpen, onClose, title, children, snapHeight = '85dvh' }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Double rAF to ensure paint before animating
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      setDragY(0);
      const t = setTimeout(() => setMounted(false), 420);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = Math.max(0, e.clientY - startY.current);
    setDragY(delta);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragY > 110) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!mounted) return null;

  const translateY = visible ? `${dragY}px` : '100%';
  const sheetTransition = isDragging.current ? 'none' : 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease';

  return (
    <>
      {/* Backdrop — full viewport */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Sheet — aligned to 390px column */}
      <div
        className="fixed bottom-0 z-50 glass-sheet rounded-t-[28px] overflow-hidden flex flex-col"
        style={{
          left: 'max(0px, calc(50vw - 195px))',
          width: 'min(390px, 100vw)',
          maxHeight: snapHeight,
          transform: `translateY(${translateY})`,
          transition: sheetTransition,
          opacity: visible ? 1 : 0,
          willChange: 'transform',
        }}
      >
        {/* Handle */}
        <div
          className="flex-shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="w-9 h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} />
        </div>

        {/* Title */}
        {title && (
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
            <h2 className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center press"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
