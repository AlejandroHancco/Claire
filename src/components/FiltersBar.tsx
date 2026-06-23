'use client';

import { useMemo } from 'react';
import { Transaction, TransactionFilters, INGRESO_CATEGORIES, EGRESO_CATEGORIES } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';

interface FiltersBarProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export default function FiltersBar({ isOpen, onClose, transactions, filters, onChange }: FiltersBarProps) {
  const { t, tCat } = useLanguage();

  const responsibles = useMemo(() => {
    const set = new Set(transactions.map(tx => tx.responsible));
    return Array.from(set).sort();
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    if (filters.type === 'Ingreso') return [...INGRESO_CATEGORIES];
    if (filters.type === 'Egreso') return [...EGRESO_CATEGORIES];
    const allCats = new Set(transactions.map(tx => tx.category));
    return Array.from(allCats).sort();
  }, [filters.type, transactions]);

  const update = (partial: Partial<TransactionFilters>) => {
    const next = { ...filters, ...partial };
    if (partial.type !== undefined && partial.type !== filters.type) {
      next.category = 'All';
    }
    onChange(next);
  };

  const reset = () => onChange({ dateFrom: '', dateTo: '', type: 'All', category: 'All', responsible: 'All' });

  const hasActive = !!(filters.dateFrom || filters.dateTo || filters.type !== 'All'
    || filters.category !== 'All' || filters.responsible !== 'All');

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('filtros_titulo')} snapHeight="90dvh">
      <div className="px-5 pb-10 space-y-6">

        {/* Tipo */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'rgba(245,245,255,0.35)' }}>{t('filtros_tipo')}</p>
          <div className="flex gap-2">
            {(['All', 'Ingreso', 'Egreso'] as const).map(tp => {
              const label = tp === 'All' ? t('filtros_todos') : (tp === 'Ingreso' ? t('tipo_ingreso') : t('tipo_egreso'));
              const active = filters.type === tp;
              const ac = tp === 'Ingreso' ? '#34D399' : tp === 'Egreso' ? '#F87171' : '#A78BFA';
              return (
                <button
                  key={tp}
                  onClick={() => update({ type: tp })}
                  className="flex-1 py-2.5 rounded-full text-[14px] font-medium press transition-all"
                  style={{
                    background: active ? `${ac}1A` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? `${ac}40` : 'rgba(255,255,255,0.09)'}`,
                    color: active ? ac : 'rgba(245,245,255,0.50)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'rgba(245,245,255,0.35)' }}>{t('filtros_categoria')}</p>
          <div className="flex flex-wrap gap-2">
            {['All', ...categoryOptions].map(cat => {
              const active = filters.category === cat;
              const label = cat === 'All' ? t('filtros_todas') : tCat(cat);
              return (
                <button
                  key={cat}
                  onClick={() => update({ category: cat })}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium press transition-all"
                  style={{
                    background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`,
                    color: active ? '#A78BFA' : 'rgba(245,245,255,0.50)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Responsable */}
        {responsibles.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
              style={{ color: 'rgba(245,245,255,0.35)' }}>{t('filtros_responsable')}</p>
            <div className="flex flex-wrap gap-2">
              {['All', ...responsibles].map(r => {
                const active = filters.responsible === r;
                const label = r === 'All' ? t('filtros_todos') : r;
                return (
                  <button
                    key={r}
                    onClick={() => update({ responsible: r })}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium press transition-all"
                    style={{
                      background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`,
                      color: active ? '#A78BFA' : 'rgba(245,245,255,0.50)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Período */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'rgba(245,245,255,0.35)' }}>{t('filtros_periodo')}</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('filtros_desde'), key: 'dateFrom' as const, value: filters.dateFrom },
              { label: t('filtros_hasta'), key: 'dateTo' as const, value: filters.dateTo },
            ].map(({ label, key, value }) => (
              <div key={key} className="relative">
                <div
                  className="flex flex-col gap-1 px-3 py-2.5 rounded-xl"
                  style={{
                    background: value ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${value ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.09)'}`,
                  }}
                >
                  <span className="text-[11px]" style={{ color: 'rgba(245,245,255,0.35)' }}>{label}</span>
                  <span className="text-[13px] font-medium" style={{ color: value ? '#A78BFA' : 'rgba(245,245,255,0.35)' }}>
                    {value ? formatDate(value) : t('filtros_seleccionar')}
                  </span>
                </div>
                <input
                  type="date"
                  value={value}
                  onChange={e => update({ [key]: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reset */}
        {hasActive && (
          <button
            onClick={() => { reset(); onClose(); }}
            className="w-full py-3 rounded-full text-[14px] font-medium press"
            style={{
              background: 'rgba(248,113,113,0.10)',
              border: '1px solid rgba(248,113,113,0.20)',
              color: '#F87171',
            }}
          >
            {t('filtros_limpiar')}
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press"
          style={{ background: '#A78BFA' }}
        >
          {t('filtros_aplicar')}
        </button>
      </div>
    </BottomSheet>
  );
}
