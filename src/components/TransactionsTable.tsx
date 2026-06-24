'use client';

import { useState, useRef } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import AvatarChip from '@/components/AvatarChip';

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
  onFilterTap?: () => void;
  onStatsTap?: () => void;
  hasActiveFilters?: boolean;
}

const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;

export default function TransactionsTable({
  transactions,
  onDelete,
  loading,
  onFilterTap,
  onStatsTap,
  hasActiveFilters,
}: TransactionsTableProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef<Record<string, number>>({});

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
    setSwipedId(null);
  };

  const onTouchStart = (id: string, e: React.TouchEvent) => {
    touchStartX.current[id] = e.touches[0].clientX;
  };

  const onTouchEnd = (id: string, e: React.TouchEvent) => {
    const startX = touchStartX.current[id] ?? 0;
    const deltaX = startX - e.changedTouches[0].clientX;
    if (deltaX > 55) setSwipedId(id);
    else if (deltaX < -20) setSwipedId(null);
  };

  if (loading) {
    return (
      <div className="px-4 space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl animate-pulse"
            style={{ background: 'rgba(255,255,255,0.05)', animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: '#F5F5FF' }}>Movimientos</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,245,255,0.35)' }}>
            {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stats button */}
          <button
            onClick={onStatsTap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium press"
            style={{
              background: 'rgba(167,139,250,0.10)',
              border: '1px solid rgba(167,139,250,0.18)',
              color: 'rgba(167,139,250,0.85)',
            }}
          >
            <span>◷</span>
            Estadísticas
          </button>

          {/* Filter button */}
          <button
            onClick={onFilterTap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium press"
            style={{
              background: hasActiveFilters ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${hasActiveFilters ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`,
              color: hasActiveFilters ? '#A78BFA' : 'rgba(245,245,255,0.50)',
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {hasActiveFilters ? 'Filtros activos' : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-[15px] font-medium" style={{ color: 'rgba(245,245,255,0.45)' }}>
            {hasActiveFilters ? 'Sin resultados para estos filtros' : 'Sin movimientos aún'}
          </p>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(245,245,255,0.25)' }}>
            {hasActiveFilters ? 'Ajusta los filtros para ver más' : 'Toca + para registrar tu primera transacción'}
          </p>
        </div>
      )}

      {/* Transaction cards */}
      <div className="px-4 space-y-2 pb-4">
        {visible.map(tx => {
          const isSwiped = swipedId === tx.id;
          const isDeleting = deleting === tx.id;
          const isIngreso = tx.type === 'Ingreso';
          const amountColor = isIngreso ? 'var(--color-ingreso)' : 'var(--color-egreso)';
          const dotBg = isIngreso ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';

          return (
            <div key={tx.id} className="relative overflow-hidden rounded-2xl">
              {/* Delete action (revealed on swipe) */}
              <div
                className="absolute right-0 top-0 bottom-0 flex items-center justify-center rounded-r-2xl"
                style={{ width: 80, background: '#EF4444' }}
              >
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={isDeleting}
                  className="flex flex-col items-center gap-1"
                >
                  {isDeleting ? (
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0H4m4 0V4a1 1 0 011-1h2a1 1 0 011 1v3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Card content */}
              <div
                onTouchStart={e => onTouchStart(tx.id, e)}
                onTouchEnd={e => onTouchEnd(tx.id, e)}
                onClick={() => { if (isSwiped) setSwipedId(null); }}
                className="flex items-center gap-3 px-4 py-3 relative"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                  transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)',
                  borderRadius: '16px',
                }}
              >
                {/* Type dot */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[16px]"
                  style={{ background: dotBg }}
                >
                  {isIngreso ? '↑' : '↓'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>
                      {tx.category}
                    </span>
                    <span
                      className="text-[14px] font-semibold tabular-nums flex-shrink-0 tx-amount"
                      style={{ color: amountColor }}
                    >
                      {isIngreso ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.35)' }}>
                      {formatDate(tx.date)}
                    </span>
                    {tx.description && (
                      <>
                        <span style={{ color: 'rgba(245,245,255,0.18)' }}>·</span>
                        <span className="text-[12px] truncate" style={{ color: 'rgba(245,245,255,0.35)' }}>
                          {tx.description}
                        </span>
                      </>
                    )}
                    <span className="ml-auto flex-shrink-0">
                      {tx.profile ? (
                        <AvatarChip
                          displayName={tx.profile.display_name}
                          avatarColor={tx.profile.avatar_color}
                          size="xs"
                          showName={false}
                        />
                      ) : (
                        <span className="text-[11px]" style={{ color: 'rgba(245,245,255,0.30)' }}>
                          {tx.responsible}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Desktop delete icon (no swipe on desktop) */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(tx.id); }}
                  className="hidden md:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:opacity-100 press"
                  style={{ background: 'rgba(248,113,113,0.10)' }}
                  title="Eliminar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{ color: '#F87171' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + LOAD_MORE_STEP)}
            className="w-full py-3 rounded-2xl text-[14px] font-medium press"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(245,245,255,0.45)',
            }}
          >
            Cargar {Math.min(LOAD_MORE_STEP, sorted.length - visibleCount)} más
            <span className="ml-1.5 text-[12px]" style={{ color: 'rgba(245,245,255,0.25)' }}>
              ({sorted.length - visibleCount} restantes)
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
