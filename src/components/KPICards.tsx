'use client';

import { Transaction, SavingsGoal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface KPICardsProps {
  transactions: Transaction[];
  savingsGoal?: SavingsGoal | null;
}

export default function KPICards({ transactions, savingsGoal }: KPICardsProps) {
  const totalIngresos = transactions
    .filter(t => t.type === 'Ingreso')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalEgresos = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const count = transactions.length;

  const savingsPct = savingsGoal && savingsGoal.target_amount > 0
    ? Math.round((savingsGoal.current_amount / savingsGoal.target_amount) * 100)
    : null;

  const chips = [
    {
      key: 'count',
      label: `${count} movimiento${count !== 1 ? 's' : ''}`,
      icon: '≡',
      color: 'rgba(167,139,250,0.85)',
      bg: 'rgba(167,139,250,0.10)',
      border: 'rgba(167,139,250,0.18)',
    },
    {
      key: 'ingresos',
      label: formatCurrency(totalIngresos),
      icon: '↑',
      color: '#34D399',
      bg: 'rgba(52,211,153,0.10)',
      border: 'rgba(52,211,153,0.18)',
    },
    {
      key: 'egresos',
      label: formatCurrency(totalEgresos),
      icon: '↓',
      color: '#F87171',
      bg: 'rgba(248,113,113,0.10)',
      border: 'rgba(248,113,113,0.18)',
    },
    ...(savingsPct !== null ? [{
      key: 'savings',
      label: `${savingsPct}% meta`,
      icon: '◎',
      color: savingsPct >= 100 ? '#34D399' : 'rgba(167,139,250,0.85)',
      bg: savingsPct >= 100 ? 'rgba(52,211,153,0.10)' : 'rgba(167,139,250,0.10)',
      border: savingsPct >= 100 ? 'rgba(52,211,153,0.18)' : 'rgba(167,139,250,0.18)',
    }] : []),
  ];

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {chips.map(chip => (
        <div
          key={chip.key}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full"
          style={{ background: chip.bg, border: `1px solid ${chip.border}` }}
        >
          <span className="text-[13px] leading-none" style={{ color: chip.color }}>{chip.icon}</span>
          <span className="text-[13px] font-medium whitespace-nowrap" style={{ color: chip.color }}>
            {chip.label}
          </span>
        </div>
      ))}
    </div>
  );
}
