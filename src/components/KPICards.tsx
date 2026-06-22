import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface KPICardsProps {
  transactions: Transaction[];
}

export default function KPICards({ transactions }: KPICardsProps) {
  const totalIngresos = transactions
    .filter(t => t.type === 'Ingreso')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalEgresos = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balanceNeto = totalIngresos - totalEgresos;

  const cards = [
    {
      label: 'Total Ingresos',
      value: formatCurrency(totalIngresos),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Total Egresos',
      value: formatCurrency(totalEgresos),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-500/20',
    },
    {
      label: 'Balance Neto',
      value: formatCurrency(balanceNeto),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: balanceNeto >= 0 ? 'text-indigo-400' : 'text-orange-400',
      bgColor: balanceNeto >= 0 ? 'bg-indigo-400/10' : 'bg-orange-400/10',
      borderColor: balanceNeto >= 0 ? 'border-indigo-500/20' : 'border-orange-500/20',
    },
    {
      label: 'Transacciones',
      value: transactions.length.toString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
      borderColor: 'border-sky-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</span>
            <div className={`${card.bgColor} ${card.borderColor} border p-1.5 rounded-lg ${card.color}`}>
              {card.icon}
            </div>
          </div>
          <p className={`text-xl font-bold ${card.color} truncate`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
