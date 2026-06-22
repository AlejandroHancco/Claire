'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroCardProps {
  ingresos: number;
  egresos: number;
  balance: number;
  loading?: boolean;
}

function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = prev.current;
    prev.current = target;

    cancelAnimationFrame(raf.current);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

function formatBalanceRaw(n: number): string {
  const abs = Math.abs(n);
  return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
}

export default function HeroCard({ ingresos, egresos, balance, loading }: HeroCardProps) {
  const animatedBalance = useCountUp(balance);
  const animatedIngresos = useCountUp(ingresos, 600);
  const animatedEgresos = useCountUp(egresos, 600);
  const isPositive = balance >= 0;

  return (
    <div
      className="relative mx-4 mt-4 mb-1 rounded-[22px] p-5 overflow-hidden shimmer-border"
      style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(255,255,255,0.05) 50%, rgba(52,211,153,0.07) 100%)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)' }}
      />

      {/* Label */}
      <p
        className="text-[11px] font-medium uppercase tracking-widest mb-3"
        style={{ color: 'rgba(245,245,255,0.40)' }}
      >
        Balance del mes
      </p>

      {/* Main balance */}
      {loading ? (
        <div className="h-12 w-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      ) : (
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-[15px] font-medium" style={{ color: 'rgba(245,245,255,0.55)' }}>S/</span>
          <span
            className="font-bold leading-none tabular-nums"
            style={{ fontSize: '40px', color: isPositive ? '#F5F5FF' : '#F87171', letterSpacing: '-0.02em' }}
          >
            {formatBalanceRaw(animatedBalance)}
          </span>
        </div>
      )}

      {/* Pills row */}
      <div className="flex gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.20)' }}
        >
          <span className="text-[11px]" style={{ color: '#34D399' }}>↑</span>
          <span className="text-[12px] font-medium tabular-nums" style={{ color: '#34D399' }}>
            S/ {formatBalanceRaw(animatedIngresos)}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.20)' }}
        >
          <span className="text-[11px]" style={{ color: '#F87171' }}>↓</span>
          <span className="text-[12px] font-medium tabular-nums" style={{ color: '#F87171' }}>
            S/ {formatBalanceRaw(animatedEgresos)}
          </span>
        </div>
      </div>
    </div>
  );
}
