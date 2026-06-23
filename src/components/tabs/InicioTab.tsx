'use client';

import { useState, useRef } from 'react';
import { Transaction, Profile } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroCard from '@/components/HeroCard';
import SavingsGoal from '@/components/SavingsGoal';
import MonthlyNote from '@/components/MonthlyNote';
import AvatarChip from '@/components/AvatarChip';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InicioTabProps {
  filteredTransactions: Transaction[];
  currentMonthData: { ingresos: number; egresos: number; balance: number };
  loading: boolean;
  userId: string;
  profiles: Profile[];
  onDelete: (id: string) => Promise<void>;
  onFilterTap: () => void;
  hasActiveFilters: boolean;
}

const INITIAL_COUNT = 5;
const LOAD_MORE_STEP = 15;

export default function InicioTab({
  filteredTransactions,
  currentMonthData,
  loading,
  userId,
  profiles,
  onDelete,
  onFilterTap,
  hasActiveFilters,
}: InicioTabProps) {
  const { t, tCat } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const touchStartX = useRef<Record<string, number>>({});

  const sorted = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
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

  return (
    <div className="space-y-3 pt-3">
      {/* Hero balance card */}
      <HeroCard
        ingresos={currentMonthData.ingresos}
        egresos={currentMonthData.egresos}
        balance={currentMonthData.balance}
        loading={loading}
      />

      {/* Savings goal */}
      <SavingsGoal userId={userId} />

      {/* Monthly notes */}
      <MonthlyNote userId={userId} profiles={profiles} />

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Transactions section */}
      <div>
        {/* Header row */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: '#F5F5FF' }}>
              {t('inicio_movimientos')}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,245,255,0.35)' }}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? t('inicio_registro') : t('inicio_registros')}
            </p>
          </div>
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
            {hasActiveFilters ? t('inicio_filtros_activos') : t('inicio_filtrar')}
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="px-4 space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.05)', animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredTransactions.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-[32px] mb-3">🪙</p>
            <p className="text-[15px] font-medium" style={{ color: 'rgba(245,245,255,0.45)' }}>
              {hasActiveFilters ? t('inicio_sin_resultados') : t('inicio_sin_movimientos')}
            </p>
            <p className="text-[13px] mt-1" style={{ color: 'rgba(245,245,255,0.25)' }}>
              {hasActiveFilters ? t('inicio_ajusta_filtros') : t('inicio_toca_mas')}
            </p>
          </div>
        )}

        {/* Transaction cards */}
        {!loading && (
          <div className="px-4 space-y-2 pb-4">
            {visible.map(tx => {
              const isSwiped = swipedId === tx.id;
              const isDeleting = deleting === tx.id;
              const isIngreso = tx.type === 'Ingreso';
              const amountColor = isIngreso ? 'var(--color-ingreso)' : 'var(--color-egreso)';
              const dotBg = isIngreso ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';

              return (
                <div key={tx.id} className="relative overflow-hidden rounded-2xl">
                  {/* Swipe delete reveal */}
                  <div
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-center rounded-r-2xl"
                    style={{ width: 80, background: '#EF4444' }}
                  >
                    <button onClick={() => handleDelete(tx.id)} disabled={isDeleting}
                      className="flex flex-col items-center gap-1">
                      {isDeleting ? (
                        <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0H4m4 0V4a1 1 0 011-1h2a1 1 0 011 1v3" />
                          </svg>
                          <span className="text-white text-[10px] font-medium">Eliminar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card */}
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[16px]"
                      style={{ background: dotBg }}>
                      {isIngreso ? '↑' : '↓'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>
                          {tCat(tx.category)}
                        </span>
                        <span className="text-[14px] font-semibold tabular-nums flex-shrink-0 tx-amount"
                          style={{ color: amountColor }}>
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
                              avatarUrl={tx.profile.avatar_url}
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

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(tx.id); }}
                      className="hidden md:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-full hover:opacity-100 press"
                      style={{ background: 'rgba(248,113,113,0.10)' }}
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
                {t('inicio_cargar_mas')} {Math.min(LOAD_MORE_STEP, sorted.length - visibleCount)} más
                <span className="ml-1.5 text-[12px]" style={{ color: 'rgba(245,245,255,0.25)' }}>
                  ({sorted.length - visibleCount} {t('inicio_restantes')})
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
