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
      color: 'var(--accent)',
      bg: 'var(--accent-soft)',
      border: 'var(--accent-border)',
    },
    {
      key: 'ingresos',
      label: formatCurrency(totalIngresos),
      icon: '↑',
      color: 'var(--color-ingreso)',
      bg: 'var(--income-bg)',
      border: 'var(--income-border)',
    },
    {
      key: 'egresos',
      label: formatCurrency(totalEgresos),
      icon: '↓',
      color: 'var(--color-egreso)',
      bg: 'var(--expense-bg)',
      border: 'var(--expense-border)',
    },
    ...(savingsPct !== null ? [{
      key: 'savings',
      label: `${savingsPct}% meta`,
      icon: '◎',
      color: savingsPct >= 100 ? 'var(--color-ingreso)' : 'var(--accent)',
      bg: savingsPct >= 100 ? 'var(--income-bg)' : 'var(--accent-soft)',
      border: savingsPct >= 100 ? 'var(--income-border)' : 'var(--accent-border)',
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
          <span className="text-[13px] leading-none tx-amount" style={{ color: chip.color }}>{chip.icon}</span>
          <span className="text-[13px] font-medium whitespace-nowrap tx-amount" style={{ color: chip.color }}>
            {chip.label}
          </span>
        </div>
      ))}
    </div>
  );
}
