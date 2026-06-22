'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';
import { Transaction } from '@/lib/types';
import { formatCurrency, getLast6Months, getMonthKey, getMonthLabel, formatDate } from '@/lib/utils';

interface ChartsSectionProps {
  transactions: Transaction[];
}

const COLORS = ['#818cf8', '#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#fb7185', '#4ade80'];

const tooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f9fafb',
};

const axisStyle = { fill: '#9ca3af', fontSize: 12 };

function MonthlyBarChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const months = getLast6Months();
    return months.map(monthKey => {
      const monthTx = transactions.filter(t => getMonthKey(t.date) === monthKey);
      const ingresos = monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0);
      const egresos = monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0);
      return { month: getMonthLabel(monthKey), ingresos, egresos };
    });
  }, [transactions]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Ingresos vs Egresos (últimos 6 meses)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="egresos" name="Egresos" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryPieChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-gray-500 text-sm">Sin datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Distribución por Categoría</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
            formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BalanceLineChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    return sorted.map(t => {
      balance += t.type === 'Ingreso' ? Number(t.amount) : -Number(t.amount);
      return { date: formatDate(t.date), balance };
    });
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-gray-500 text-sm">Sin datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Tendencia del Balance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatCurrency(Number(value ?? 0))}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#818cf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ChartsSection({ transactions }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <MonthlyBarChart transactions={transactions} />
      <CategoryPieChart transactions={transactions} />
      <BalanceLineChart transactions={transactions} />
    </div>
  );
}
