'use client';

import { useState, useRef } from 'react';
import { Transaction, Profile } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import HeroCard from '@/components/HeroCard';
import SavingsGoal from '@/components/SavingsGoal';
import MonthlyNote from '@/components/MonthlyNote';
import AvatarChip from '@/components/AvatarChip';
import BottomSheet from '@/components/BottomSheet';
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
  onViewAll: () => void;
}

const PREVIEW_COUNT = 5;
const SWIPE_WIDTH = 80;
const SWIPE_THRESHOLD = 40;
const SPRING = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

export default function InicioTab({
  filteredTransactions,
  currentMonthData,
  loading,
  userId,
  profiles,
  onDelete,
  onFilterTap,
  hasActiveFilters,
  onViewAll,
}: InicioTabProps) {
  const { t, tCat } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmTx, setConfirmTx] = useState<Transaction | null>(null);
  const [exiting, setExiting] = useState<string | null>(null);

  // Refs for direct DOM animation (no re-render during drag)
  const cardEls = useRef<Record<string, HTMLDivElement | null>>({});
  const drag = useRef<{ id: string; x0: number; dx: number; base: number } | null>(null);

  const sorted = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
  const visible = sorted.slice(0, PREVIEW_COUNT);
  const hasMore = sorted.length > PREVIEW_COUNT;

  function snapCard(id: string, open: boolean) {
    const el = cardEls.current[id];
    if (!el) return;
    el.style.transition = SPRING;
    el.style.transform = open ? `translateX(-${SWIPE_WIDTH}px)` : 'translateX(0)';
  }

  const handleConfirmedDelete = async (id: string) => {
    setExiting(id);
    await new Promise(r => setTimeout(r, 260));
    await onDelete(id);
    setExiting(null);
    setOpenId(null);
  };

  function onTouchStart(id: string, e: React.TouchEvent) {
    drag.current = { id, x0: e.touches[0].clientX, dx: 0, base: openId === id ? SWIPE_WIDTH : 0 };
    const el = cardEls.current[id];
    if (el) el.style.transition = 'none';
  }

  function onTouchMove(id: string, e: React.TouchEvent) {
    const d = drag.current;
    if (!d || d.id !== id) return;
    d.dx = d.x0 - e.touches[0].clientX;
    const raw = d.base + d.dx;
    const clamped = Math.max(0, Math.min(SWIPE_WIDTH, raw));
    const el = cardEls.current[id];
    if (el) el.style.transform = `translateX(-${clamped}px)`;
  }

  function onTouchEnd(id: string) {
    const d = drag.current;
    if (!d || d.id !== id) return;
    drag.current = null;

    if (Math.abs(d.dx) < 5) {
      if (openId) { snapCard(openId, false); setOpenId(null); }
      return;
    }

    const raw = d.base + d.dx;
    if (raw >= SWIPE_THRESHOLD) {
      if (openId && openId !== id) snapCard(openId, false);
      snapCard(id, true);
      setOpenId(id);
    } else {
      snapCard(id, false);
      if (openId === id) setOpenId(null);
    }
  }

  function onTouchCancel(id: string) {
    drag.current = null;
    snapCard(id, openId === id);
  }

  return (
    <div className="space-y-3 pt-3">
      {/* Hero balance card */}
      <HeroCard
        ingresos={currentMonthData.ingresos}
        egresos={currentMonthData.egresos}
        balance={currentMonthData.balance}
        loading={loading}
      />

      {/* Savings goal — progress driven by current month's net balance */}
      <SavingsGoal userId={userId} monthBalance={currentMonthData.balance} />

      {/* Monthly notes */}
      <MonthlyNote userId={userId} profiles={profiles} />

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: 'var(--border-subtle)' }} />

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
              background: hasActiveFilters ? 'var(--accent-soft)' : 'var(--surface)',
              border: `1px solid ${hasActiveFilters ? 'var(--accent-border)' : 'var(--border)'}`,
              color: hasActiveFilters ? 'var(--accent)' : 'var(--text-muted)',
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
          <div className="px-4 pb-4">
            {visible.map(tx => {
              const isOwn = tx.user_id === userId;
              const isExiting = exiting === tx.id;
              const isIngreso = tx.type === 'Ingreso';
              const amountColor = isIngreso ? 'var(--color-ingreso)' : 'var(--color-egreso)';
              const dotBg = isIngreso ? 'var(--income-bg)' : 'var(--expense-bg)';

              return (
                /* Animation wrapper — collapses + fades when this card is being deleted */
                <div
                  key={tx.id}
                  style={{
                    overflow: 'hidden',
                    maxHeight: isExiting ? 0 : 200,
                    opacity: isExiting ? 0 : 1,
                    marginBottom: isExiting ? 0 : 8,
                    transition: isExiting
                      ? 'max-height 300ms ease, opacity 250ms ease, margin-bottom 300ms ease'
                      : 'none',
                  }}
                >
                  {/* Card shell */}
                  <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{
                      border: '1px solid var(--border)',
                      ...(isOwn ? { borderLeft: '3px solid var(--accent-border)' } : {}),
                    }}
                  >
                    {/* Red delete zone — sits BEHIND the card (z-index: 1), revealed on swipe */}
                    {isOwn && (
                      <div
                        className="absolute right-0 top-0 bottom-0 flex items-center justify-center"
                        style={{ width: SWIPE_WIDTH, background: '#EF4444', zIndex: 1 }}
                      >
                        <button
                          onClick={() => setConfirmTx(tx)}
                          className="flex flex-col items-center gap-1"
                          aria-label="Eliminar transacción"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0H4m4 0V4a1 1 0 011-1h2a1 1 0 011 1v3" />
                          </svg>
                          <span className="text-white text-[10px] font-semibold">Eliminar</span>
                        </button>
                      </div>
                    )}

                    {/* Sliding card — sits ON TOP (z-index: 2), opaque so delete zone is hidden until swiped */}
                    <div
                      ref={el => { cardEls.current[tx.id] = el; }}
                      onTouchStart={isOwn ? e => onTouchStart(tx.id, e) : undefined}
                      onTouchMove={isOwn ? e => onTouchMove(tx.id, e) : undefined}
                      onTouchEnd={isOwn ? () => onTouchEnd(tx.id) : undefined}
                      onTouchCancel={isOwn ? () => onTouchCancel(tx.id) : undefined}
                      className="flex items-center gap-3 px-3 py-3"
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        background: isOwn ? 'var(--card-surface-own)' : 'var(--card-surface)',
                        transform: openId === tx.id ? `translateX(-${SWIPE_WIDTH}px)` : 'translateX(0)',
                        transition: SPRING,
                        touchAction: isOwn ? 'pan-y' : undefined,
                      }}
                    >
                      {/* Type indicator */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[16px]"
                        style={{ background: dotBg }}>
                        {isIngreso ? '↑' : '↓'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>
                            {tCat(tx.category)}
                          </span>
                          <span className="text-[14px] font-semibold tabular-nums flex-shrink-0"
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
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <button
                onClick={onViewAll}
                className="w-full py-3 rounded-2xl text-[14px] font-medium press flex items-center justify-center gap-1.5"
                style={{
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                {t('inicio_ver_todo')}
                <span className="text-[12px] tx-amount" style={{ color: 'var(--accent)' }}>
                  · {sorted.length - PREVIEW_COUNT} {t('inicio_restantes')}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation sheet */}
      <BottomSheet
        isOpen={!!confirmTx}
        onClose={() => {
          if (confirmTx) { snapCard(confirmTx.id, false); setOpenId(null); }
          setConfirmTx(null);
        }}
        snapHeight="44dvh"
      >
        {confirmTx && (
          <div className="px-5 pb-8">
            <p className="text-[16px] font-semibold mb-4" style={{ color: '#F5F5FF' }}>
              {t('delete_title')}
            </p>

            {/* Transaction preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl mb-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: confirmTx.type === 'Ingreso' ? 'var(--income-bg)' : 'var(--expense-bg)' }}>
                {confirmTx.type === 'Ingreso' ? '↑' : '↓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>
                    {tCat(confirmTx.category)}
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums flex-shrink-0"
                    style={{ color: confirmTx.type === 'Ingreso' ? 'var(--color-ingreso)' : 'var(--color-egreso)' }}>
                    {confirmTx.type === 'Ingreso' ? '+' : '−'}{formatCurrency(Number(confirmTx.amount))}
                  </span>
                </div>
                <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.40)' }}>
                  {formatDate(confirmTx.date)}{confirmTx.description ? ` · ${confirmTx.description}` : ''}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { snapCard(confirmTx.id, false); setOpenId(null); setConfirmTx(null); }}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold press"
                style={{ background: 'var(--surface-el)', color: 'var(--text-secondary)' }}
              >
                {t('delete_cancel')}
              </button>
              <button
                onClick={() => {
                  const id = confirmTx.id;
                  setConfirmTx(null);
                  handleConfirmedDelete(id);
                }}
                className="flex-1 py-3 rounded-2xl text-[15px] font-semibold press"
                style={{ background: 'rgba(239,68,68,0.90)', color: '#fff' }}
              >
                {t('delete_confirm_btn')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
