'use client';

import { useState } from 'react';

interface FABProps {
  onIngreso: () => void;
  onEgreso: () => void;
}

export default function FAB({ onIngreso, onEgreso }: FABProps) {
  const [expanded, setExpanded] = useState(false);

  const open = () => setExpanded(true);
  const close = () => setExpanded(false);

  return (
    <>
      {/* Dim backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-[48]"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={close}
        />
      )}

      {/* FAB container — fixed within 390px column */}
      <div
        className="fixed z-[49] flex flex-col items-center gap-3"
        style={{
          bottom: '80px',
          right: 'max(24px, calc(50vw - 171px))',
        }}
      >
        {/* Sub-FABs (egreso first so it appears on top visually when stacked) */}
        <div
          className="flex flex-col items-end gap-3 transition-all duration-300"
          style={{
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? 'auto' : 'none',
            transform: expanded ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
            transitionDelay: expanded ? '30ms' : '0ms',
          }}
        >
          <SubFAB
            label="↑ Ingreso"
            color="#34D399"
            delay={expanded ? '60ms' : '0ms'}
            expanded={expanded}
            onClick={() => { close(); onIngreso(); }}
          />
          <SubFAB
            label="↓ Egreso"
            color="#F87171"
            delay={expanded ? '0ms' : '0ms'}
            expanded={expanded}
            onClick={() => { close(); onEgreso(); }}
          />
        </div>

        {/* Main FAB */}
        <button
          onClick={expanded ? close : open}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl press"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 4px 16px var(--fab-shadow)',
          }}
          aria-label="Nueva transacción"
        >
          <svg
            className="w-6 h-6 text-white transition-transform duration-250"
            style={{ transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </>
  );
}

function SubFAB({
  label,
  color,
  delay,
  expanded,
  onClick,
}: {
  label: string;
  color: string;
  delay: string;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 transition-all duration-250"
      style={{
        opacity: expanded ? 1 : 0,
        transform: expanded ? 'scale(1)' : 'scale(0.85)',
        transitionDelay: delay,
      }}
    >
      <span
        className="text-[13px] font-medium px-3 py-1 rounded-full"
        style={{ background: 'rgba(0,0,0,0.55)', color: '#F5F5FF' }}
      >
        {label}
      </span>
      <button
        onClick={onClick}
        className="w-11 h-11 rounded-full flex items-center justify-center press flex-shrink-0"
        style={{ background: color }}
        aria-label={label}
      >
        <span className="text-white text-lg font-semibold leading-none">
          {label.startsWith('↑') ? '↑' : '↓'}
        </span>
      </button>
    </div>
  );
}
