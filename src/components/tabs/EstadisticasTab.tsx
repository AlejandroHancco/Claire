'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { Transaction } from '@/lib/types';
import { formatCurrency, getMonthKey, getMonthLabel } from '@/lib/utils';

interface EstadisticasTabProps {
  transactions: Transaction[];
}

type DateRange = '1M' | '3M' | '6M' | 'Todo';

const RANGES: { key: DateRange; label: string }[] = [
  { key: '1M', label: '1 mes' },
  { key: '3M', label: '3 meses' },
  { key: '6M', label: '6 meses' },
  { key: 'Todo', label: 'Todo' },
];

const COLORS = ['#A78BFA', '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#F472B6', '#4ADE80', '#C084FC'];

const tooltipStyle = {
  background: 'rgba(14,14,26,0.95)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '12px',
  color: '#F5F5FF',
  fontSize: '12px',
};

const axisStyle = { fill: 'rgba(245,245,255,0.35)', fontSize: 11 };

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

export default function EstadisticasTab({ transactions }: EstadisticasTabProps) {
  const [range, setRange] = useState<DateRange>('6M');

  const filtered = useMemo(() => {
    const cutoff = getDateCutoff(range);
    if (!cutoff) return transactions;
    return transactions.filter(t => t.date >= cutoff);
  }, [transactions, range]);

  const months = useMemo(() => getMonthsForRange(range, filtered), [range, filtered]);

  const monthlyData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = filtered.filter(t => getMonthKey(t.date) === monthKey);
      return {
        name: getMonthLabel(monthKey),
        Ingresos: monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0),
        Egresos: monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0),
      };
    }), [filtered, months]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'Egreso').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const trendData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = filtered.filter(t => getMonthKey(t.date) === monthKey);
      const ing = monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0);
      const egr = monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0);
      return { name: getMonthLabel(monthKey), Balance: ing - egr };
    }), [filtered, months]);

  return (
    <div className="pb-6">
      {/* Title */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>Estadísticas</h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>
          Análisis de tus finanzas
        </p>
      </div>

      {/* Date range filter chips */}
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
            Sin datos para este período
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-6 px-4">
          {/* Monthly bar chart */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>Ingresos vs Egresos</p>
            <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
              Por mes
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="30%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                <Bar dataKey="Ingresos" fill="#34D399" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Egresos" fill="#F87171" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category pie chart */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>Egresos por categoría</p>
            {categoryData.length === 0 ? (
              <p className="text-center text-[14px] py-8" style={{ color: 'rgba(245,245,255,0.30)' }}>
                Sin egresos registrados
              </p>
            ) : (
              <>
                <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
                  Distribución
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="42%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend formatter={v => <span style={{ color: 'rgba(245,245,255,0.60)', fontSize: 11 }}>{v}</span>} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Balance trend */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[13px] font-semibold mb-1" style={{ color: '#F5F5FF' }}>Tendencia de balance</p>
            <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
              Balance neto mensual
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                  tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={44} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
                <Line
                  type="monotone"
                  dataKey="Balance"
                  stroke="#A78BFA"
                  strokeWidth={2.5}
                  dot={{ fill: '#A78BFA', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#A78BFA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
