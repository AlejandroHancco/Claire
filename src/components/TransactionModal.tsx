'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TransactionType, INGRESO_CATEGORIES, EGRESO_CATEGORIES } from '@/lib/types';
import { getTodayString } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  date: string;
  type: TransactionType;
  category: string;
  amount: string;
  description: string;
  responsible: string;
}

const initialForm = (): FormState => ({
  date: getTodayString(),
  type: 'Ingreso',
  category: INGRESO_CATEGORIES[0],
  amount: '',
  description: '',
  responsible: '',
});

const inputClass =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-500';

const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider';

export default function TransactionModal({ isOpen, onClose, onSuccess }: TransactionModalProps) {
  const [form, setForm] = useState<FormState>(initialForm());
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm());
      setErrors({});
    }
  }, [isOpen]);

  const categories = form.type === 'Ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES;

  const update = (field: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'type') {
        next.category = (value === 'Ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES)[0];
      }
      return next;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.date) errs.date = 'Requerido';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Ingrese un monto válido';
    if (!form.responsible.trim()) errs.responsible = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('transactions').insert({
      user_id: user!.id,
      date: form.date,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      description: form.description.trim() || null,
      responsible: form.responsible.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error('Error al guardar la transacción');
    } else {
      toast.success('Transacción registrada');
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-white">Nueva Transacción</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo toggle */}
          <div>
            <label className={labelClass}>Tipo</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-700 p-1 bg-gray-800/50">
              {(['Ingreso', 'Egreso'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('type', t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    form.type === t
                      ? t === 'Ingreso'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                className={`${inputClass} ${errors.date ? 'border-red-500' : ''}`}
                style={{ colorScheme: 'dark' }}
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={form.category}
                onChange={e => update('category', e.target.value)}
                className={inputClass}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className={labelClass}>Monto (S/)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">S/</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                className={`${inputClass} pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Responsable */}
          <div>
            <label className={labelClass}>Responsable</label>
            <input
              type="text"
              value={form.responsible}
              onChange={e => update('responsible', e.target.value)}
              className={`${inputClass} ${errors.responsible ? 'border-red-500' : ''}`}
              placeholder="Nombre del responsable"
            />
            {errors.responsible && <p className="text-red-400 text-xs mt-1">{errors.responsible}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción <span className="text-gray-600 normal-case">(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              className={`${inputClass} resize-none h-20`}
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
