'use client';

import { useMemo } from 'react';
import { Transaction, TransactionFilters, TransactionType, INGRESO_CATEGORIES, EGRESO_CATEGORIES } from '@/lib/types';

interface FiltersBarProps {
  transactions: Transaction[];
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

const selectClass =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full';

const inputClass =
  'bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full';

export default function FiltersBar({ transactions, filters, onChange }: FiltersBarProps) {
  const responsibles = useMemo(() => {
    const set = new Set(transactions.map(t => t.responsible));
    return Array.from(set).sort();
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    if (filters.type === 'Ingreso') return [...INGRESO_CATEGORIES];
    if (filters.type === 'Egreso') return [...EGRESO_CATEGORIES];
    const allCats = new Set(transactions.map(t => t.category));
    return Array.from(allCats).sort();
  }, [filters.type, transactions]);

  const update = (partial: Partial<TransactionFilters>) => {
    const next = { ...filters, ...partial };
    if (partial.type !== undefined && partial.type !== filters.type) {
      next.category = 'All';
    }
    onChange(next);
  };

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.type !== 'All' || filters.category !== 'All' || filters.responsible !== 'All';

  const reset = () =>
    onChange({ dateFrom: '', dateTo: '', type: 'All', category: 'All', responsible: 'All' });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => update({ dateFrom: e.target.value })}
            className={inputClass}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => update({ dateTo: e.target.value })}
            className={inputClass}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Tipo</label>
          <select
            value={filters.type}
            onChange={e => update({ type: e.target.value as 'All' | TransactionType })}
            className={selectClass}
          >
            <option value="All">Todos</option>
            <option value="Ingreso">Ingreso</option>
            <option value="Egreso">Egreso</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Categoría</label>
          <select
            value={filters.category}
            onChange={e => update({ category: e.target.value })}
            className={selectClass}
          >
            <option value="All">Todas</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Responsable</label>
          <select
            value={filters.responsible}
            onChange={e => update({ responsible: e.target.value })}
            className={selectClass}
          >
            <option value="All">Todos</option>
            {responsibles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
