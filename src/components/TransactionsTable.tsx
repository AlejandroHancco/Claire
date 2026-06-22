'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import AvatarChip from '@/components/AvatarChip';

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const PAGE_SIZE = 10;

export default function TransactionsTable({ transactions, onDelete, loading }: TransactionsTableProps) {
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = [...transactions].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
    setConfirmId(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex justify-center">
        <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">
          Transacciones
          <span className="ml-2 text-xs text-gray-500 font-normal">
            ({transactions.length} {transactions.length === 1 ? 'registro' : 'registros'})
          </span>
        </h3>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500 text-sm">No hay transacciones para mostrar</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors select-none"
                    onClick={() => { setSortAsc(p => !p); setPage(1); }}
                  >
                    <span className="flex items-center gap-1">
                      Fecha
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortAsc ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Responsable</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {paginated.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'Ingreso'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-400/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{tx.category}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.type === 'Ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'Egreso' ? '−' : '+'}{formatCurrency(Number(tx.amount))}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-[200px] truncate">
                      {tx.description || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {tx.profile ? (
                        <AvatarChip
                          displayName={tx.profile.display_name}
                          avatarColor={tx.profile.avatar_color}
                          size="xs"
                          showName
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">{tx.responsible || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {confirmId === tx.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            disabled={deleting === tx.id}
                            className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg transition-colors"
                          >
                            {deleting === tx.id ? '...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(tx.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-gray-600 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                          currentPage === p
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
