'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { Transaction } from '@/lib/types';
import { formatCurrency, getLast6Months, getMonthKey, getMonthLabel } from '@/lib/utils';

interface ChartsSectionProps {
  transactions: Transaction[];
}

const COLORS = ['#A78BFA', '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#F472B6', '#4ADE80', '#C084FC'];

const tooltipStyle = {
  background: 'rgba(14,14,26,0.95)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '12px',
  color: '#F5F5FF',
  fontSize: '12px',
};

const axisStyle = { fill: 'rgba(245,245,255,0.35)', fontSize: 11 };

type Tab = 'monthly' | 'categories' | 'trend';

export default function ChartsSection({ transactions }: ChartsSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');

  const months = useMemo(() => getLast6Months(), []);

  const monthlyData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = transactions.filter(t => getMonthKey(t.date) === monthKey);
      return {
        name: getMonthLabel(monthKey),
        Ingresos: monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0),
        Egresos: monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0),
      };
    }), [transactions, months]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'Egreso').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const trendData = useMemo(() =>
    months.map(monthKey => {
      const monthTx = transactions.filter(t => getMonthKey(t.date) === monthKey);
      const ing = monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0);
      const egr = monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0);
      return { name: getMonthLabel(monthKey), Balance: ing - egr };
    }), [transactions, months]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'monthly', label: 'Mensual' },
    { key: 'categories', label: 'Categorías' },
    { key: 'trend', label: 'Tendencia' },
  ];

  return (
    <div className="px-4 pb-6">
      {/* Tab selector */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex-1 py-2 rounded-full text-[13px] font-medium transition-all duration-200 press"
            style={{
              background: activeTab === t.key ? '#A78BFA' : 'transparent',
              color: activeTab === t.key ? '#fff' : 'rgba(245,245,255,0.45)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Monthly bar chart */}
      {activeTab === 'monthly' && (
        <>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
            Ingresos vs Egresos · últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="30%" barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => formatCurrency(Number(v ?? 0))} />
              <Bar dataKey="Ingresos" fill="#34D399" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Egresos" fill="#F87171" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Category pie chart */}
      {activeTab === 'categories' && (
        <>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
            Distribución de egresos por categoría
          </p>
          {categoryData.length === 0 ? (
            <p className="text-center text-[14px] py-12" style={{ color: 'rgba(245,245,255,0.30)' }}>
              Sin egresos registrados
            </p>
          ) : (
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
          )}
        </>
      )}

      {/* Balance trend */}
      {activeTab === 'trend' && (
        <>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(245,245,255,0.40)' }}>
            Balance neto · últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={44} />
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
        </>
      )}
    </div>
  );
}
