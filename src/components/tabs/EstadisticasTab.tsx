'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { Transaction } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency, formatDate, getMonthKey, getMonthLabel } from '@/lib/utils';
import AvatarChip from '@/components/AvatarChip';

interface EstadisticasTabProps {
  transactions: Transaction[];
  filteredTransactions?: Transaction[];
  onFilterTap?: () => void;
  hasActiveFilters?: boolean;
  scrollToHistory?: boolean;
  onScrollHandled?: () => void;
}

type DateRange = '1M' | '3M' | '6M' | 'Todo';

const COLORS = ['#A78BFA', '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#F472B6', '#4ADE80', '#C084FC'];

const tooltipStyle = {
  background: 'rgba(14,14,26,0.95)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '12px',
  color: '#F5F5FF',
  fontSize: '12px',
};

const axisStyle = { fill: 'rgba(245,245,255,0.35)', fontSize: 11 };

// Smart Y axis formatter: avoids "S/0k" for sub-1000 values
function formatYAxis(v: number): string {
  const abs = Math.abs(v);
  if (abs === 0) return 'S/ 0';
  const pfx = v < 0 ? '−' : '';
  if (abs >= 1000) {
    const n = abs / 1000;
    const label = n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
    return `${pfx}S/ ${label}k`;
  }
  return `${pfx}S/ ${abs.toFixed(0)}`;
}

// Compute a domain ceiling with ~20% headroom, snapped to a round number
function niceMax(dataMax: number): number {
  if (dataMax <= 0) return 100;
  const withPad = dataMax * 1.2;
  const mag = Math.pow(10, Math.floor(Math.log10(withPad)));
  return Math.ceil(withPad / mag) * mag;
}

function getDateCutoff(range: DateRange): string | null {
  if (range === 'Todo') return null;
  const days = range === '1M' ? 30 : range === '3M' ? 90 : 180;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
}

function getMonthsForRange(range: DateRange, transactions: Transaction[]): string[] {
  if (range === 'Todo') {
    const months = Array.from(new Set(transactions.map(t => getMonthKey(t.date)))).sort();
    return months.length > 0 ? months : [];
  }
  const n = range === '1M' ? 1 : range === '3M' ? 3 : 6;
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export default function EstadisticasTab({
  transactions,
  filteredTransactions,
  onFilterTap,
  hasActiveFilters,
  scrollToHistory,
  onScrollHandled,
}: EstadisticasTabProps) {
  const { t, tCat } = useLanguage();
  const [range, setRange] = useState<DateRange>('6M');
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToHistory) return;
    const timer = setTimeout(() => {
      historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrollHandled?.();
    }, 150);
    return () => clearTimeout(timer);
  }, [scrollToHistory, onScrollHandled]);

  const RANGES: { key: DateRange; label: string }[] = [
    { key: '1M', label: t('range_1m') },
    { key: '3M', label: t('range_3m') },
    { key: '6M', label: t('range_6m') },
    { key: 'Todo', label: t('range_all') },
  ];

  const filtered = useMemo(() => {
    const cutoff = getDateCutoff(range);
    if (!cutoff) return transactions;
    return transactions.filter(tx => tx.date >= cutoff);
  }, [transactions, range]);

  const months = useMemo(() => getMonthsForRange(range, filtered), [range, filtered]);

  const ingLabel = t('chart_ingresos');
  const egrLabel = t('chart_egresos');
  const balLabel = t('chart_balance');

  const monthlyData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = filtered.filter(tx => getMonthKey(tx.date) === monthKey);
      return {
        name: getMonthLabel(monthKey),
        [ingLabel]: monthTx.filter(tx => tx.type === 'Ingreso').reduce((s, tx) => s + Number(tx.amount), 0),
        [egrLabel]: monthTx.filter(tx => tx.type === 'Egreso').reduce((s, tx) => s + Number(tx.amount), 0),
      };
    }), [filtered, months, ingLabel, egrLabel]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(tx => tx.type === 'Egreso').forEach(tx => {
      const label = tCat(tx.category);
      map[label] = (map[label] ?? 0) + Number(tx.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered, tCat]);

  const trendData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = filtered.filter(tx => getMonthKey(tx.date) === monthKey);
      const ing = monthTx.filter(tx => tx.type === 'Ingreso').reduce((s, tx) => s + Number(tx.amount), 0);
      const egr = monthTx.filter(tx => tx.type === 'Egreso').reduce((s, tx) => s + Number(tx.amount), 0);
      return { name: getMonthLabel(monthKey), [balLabel]: ing - egr };
    }), [filtered, months, balLabel]);

  // Pre-compute domains so bars never touch the top edge
  const barMax = useMemo(() => {
    const vals = monthlyData.flatMap(d => [Number(d[ingLabel] ?? 0), Number(d[egrLabel] ?? 0)]);
    return niceMax(Math.max(0, ...vals));
  }, [monthlyData, ingLabel, egrLabel]);

  const trendMin = useMemo(() => {
    const vals = trendData.map(d => Number(d[balLabel] ?? 0));
    const mn = Math.min(0, ...vals);
    return mn < 0 ? -(niceMax(Math.abs(mn))) : 0;
  }, [trendData, balLabel]);

  const trendMax = useMemo(() => {
    const vals = trendData.map(d => Number(d[balLabel] ?? 0));
    return niceMax(Math.max(0, ...vals));
  }, [trendData, balLabel]);

  // History list — respects dashboard filters (if provided) + same date range as charts
  const historySorted = useMemo(() => {
    const base = filteredTransactions ?? transactions;
    const cutoff = getDateCutoff(range);
    const inRange = cutoff ? base.filter(tx => tx.date >= cutoff) : base;
    return [...inRange].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTransactions, transactions, range]);

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>{t('stats_titulo')}</h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>{t('stats_subtitulo')}</p>
      </div>

      {/* Date range chips */}
      <div className="px-4 flex gap-2 mb-5">
        {RANGES.map(r => {
          const active = range === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="px-3 py-1.5 rounded-full text-[13px] font-medium press transition-all"
              style={{
                background: active ? '#A78BFA' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${active ? '#A78BFA' : 'rgba(255,255,255,0.10)'}`,
                color: active ? '#fff' : 'rgba(245,245,255,0.55)',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="text-[32px] mb-3">📊</p>
          <p className="text-[15px] font-medium" style={{ color: 'rgba(245,245,255,0.45)' }}>
            {t('stats_sin_datos')}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-6 px-4">
          {/* ── Monthly bar chart ─────────────────────────────────────────── */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>{t('stats_ing_vs_egr')}</p>
            <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>{t('stats_por_mes')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="30%" barGap={3} margin={{ top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={formatYAxis} width={58}
                  domain={[0, barMax]}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                <Bar dataKey={ingLabel} fill="#34D399" radius={[5, 5, 0, 0]} />
                <Bar dataKey={egrLabel} fill="#F87171" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Category pie chart ────────────────────────────────────────── */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>{t('stats_por_categoria')}</p>
            {categoryData.length === 0 ? (
              <p className="text-center text-[14px] py-8" style={{ color: 'rgba(245,245,255,0.30)' }}>
                {t('stats_sin_egresos')}
              </p>
            ) : (
              <>
                <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>{t('stats_distribucion')}</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="42%" innerRadius={55} outerRadius={88}
                      paddingAngle={3} dataKey="value"
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend formatter={v => <span style={{ color: 'rgba(245,245,255,0.60)', fontSize: 11 }}>{v}</span>} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* ── Balance trend ─────────────────────────────────────────────── */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>{t('stats_tendencia')}</p>
            <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>{t('stats_balance_mensual')}</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={formatYAxis} width={62}
                  domain={[trendMin, trendMax]}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                <Line type="monotone" dataKey={balLabel} stroke="#A78BFA" strokeWidth={2.5}
                  dot={{ fill: '#A78BFA', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#A78BFA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Transaction history ───────────────────────────────────────── */}
          <div ref={historyRef} className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[13px] font-semibold" style={{ color: '#F5F5FF' }}>
                {t('stats_historial')}
              </p>
              <div className="flex items-center gap-2">
                {onFilterTap && (
                  <button
                    onClick={onFilterTap}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium press"
                    style={{
                      background: hasActiveFilters ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${hasActiveFilters ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.09)'}`,
                      color: hasActiveFilters ? '#A78BFA' : 'rgba(245,245,255,0.50)',
                    }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    {hasActiveFilters ? t('inicio_filtros_activos') : t('inicio_filtrar')}
                  </button>
                )}
                <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.40)' }}>
                  {historySorted.length} {historySorted.length === 1 ? t('inicio_registro') : t('inicio_registros')}
                </span>
              </div>
            </div>

            {/* Scrollable list — max 400px, no infinite page growth */}
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {historySorted.map((tx, idx) => {
                const isIngreso = tx.type === 'Ingreso';
                const amountColor = isIngreso ? 'var(--color-ingreso)' : 'var(--color-egreso)';
                const dotBg = isIngreso ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';
                const isLast = idx === historySorted.length - 1;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={isLast ? undefined : { borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {/* Type dot */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[14px]"
                      style={{ background: dotBg }}
                    >
                      {isIngreso ? '↑' : '↓'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium truncate" style={{ color: '#F5F5FF' }}>
                          {tCat(tx.category)}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums flex-shrink-0"
                          style={{ color: amountColor }}>
                          {isIngreso ? '+' : '−'}{formatCurrency(Number(tx.amount))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: 'rgba(245,245,255,0.35)' }}>
                          {formatDate(tx.date)}
                        </span>
                        {tx.description && (
                          <>
                            <span style={{ color: 'rgba(245,245,255,0.18)' }}>·</span>
                            <span className="text-[11px] truncate" style={{ color: 'rgba(245,245,255,0.35)' }}>
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
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
