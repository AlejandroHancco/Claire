'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const animatedBalance = useCountUp(balance);
  const animatedIngresos = useCountUp(ingresos, 600);
  const animatedEgresos = useCountUp(egresos, 600);
  const isPositive = balance >= 0;

  return (
    <div
      className="relative mx-4 mt-4 mb-1 rounded-[22px] p-5 overflow-hidden shimmer-border"
      style={{
        background: 'var(--hero-gradient)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid var(--hero-border)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)' }}
      />

      {/* Label — translated */}
      <p
          className="text-[11px] font-bold mb-3 uppercase"
          style={{ color: 'var(--text-muted)' }}
      >
        {t('hero_balance')}
      </p>

      {/* Main balance */}
      {loading ? (
        <div className="h-12 w-48 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      ) : (
        <div className="flex items-baseline gap-1 mb-4">
          {/* S/ is bold at ~45% of the number size for consistent weight relationship */}
          <span
            className="font-bold tabular-nums tx-amount"
            style={{ fontSize: '18px', color: isPositive ? 'var(--text-secondary)' : 'var(--color-egreso)' }}
          >
            S/
          </span>
          <span
            className="font-bold leading-none tabular-nums tx-amount"
            style={{ fontSize: '40px', color: isPositive ? 'var(--text-primary)' : 'var(--color-egreso)', letterSpacing: '-0.02em' }}
          >
            {formatBalanceRaw(animatedBalance)}
          </span>
        </div>
      )}

      {/* Pills row */}
      <div className="flex gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'var(--income-bg)', border: '1px solid var(--income-border)' }}
        >
          <span className="text-[11px] tx-amount" style={{ color: 'var(--color-ingreso)' }}>↑</span>
          <span className="text-[12px] font-semibold tabular-nums tx-amount" style={{ color: 'var(--color-ingreso)' }}>
            S/ {formatBalanceRaw(animatedIngresos)}
          </span>
        </div>

        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'var(--expense-bg)', border: '1px solid var(--expense-border)' }}
        >
          <span className="text-[11px] tx-amount" style={{ color: 'var(--color-egreso)' }}>↓</span>
          <span className="text-[12px] font-semibold tabular-nums tx-amount" style={{ color: 'var(--color-egreso)' }}>
            S/ {formatBalanceRaw(animatedEgresos)}
          </span>
        </div>
      </div>
    </div>
  );
}
