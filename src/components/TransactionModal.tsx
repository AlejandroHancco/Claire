'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TransactionType, INGRESO_CATEGORIES, EGRESO_CATEGORIES } from '@/lib/types';
import { getTodayString, formatDate } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: TransactionType;
}

interface FormState {
  date: string;
  type: TransactionType;
  category: string;
  amount: string;
  description: string;
  responsible: string;
}

const initialForm = (type: TransactionType = 'Ingreso'): FormState => ({
  date: getTodayString(),
  type,
  category: (type === 'Ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES)[0],
  amount: '',
  description: '',
  responsible: '',
});

export default function TransactionModal({ isOpen, onClose, onSuccess, defaultType }: TransactionModalProps) {
  const [form, setForm] = useState<FormState>(initialForm(defaultType));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm(defaultType ?? 'Ingreso'));
      setErrors({});
    }
  }, [isOpen, defaultType]);

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

  const isIngreso = form.type === 'Ingreso';
  const accentColor = isIngreso ? '#34D399' : '#F87171';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapHeight="92dvh">
      <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-5">

        {/* Type selector — two large pills */}
        <div className="flex gap-2 p-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['Ingreso', 'Egreso'] as TransactionType[]).map(t => {
            const active = form.type === t;
            const color = t === 'Ingreso' ? '#34D399' : '#F87171';
            return (
              <button
                key={t}
                type="button"
                onClick={() => update('type', t)}
                className="flex-1 py-3 rounded-full text-[15px] font-semibold transition-all duration-200 press"
                style={{
                  background: active ? `${color}20` : 'transparent',
                  color: active ? color : 'rgba(245,245,255,0.35)',
                  border: active ? `1px solid ${color}40` : '1px solid transparent',
                }}
              >
                {t === 'Ingreso' ? '↑ Ingreso' : '↓ Egreso'}
              </button>
            );
          })}
        </div>

        {/* Amount — large centered */}
        <div className="text-center py-2">
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>Monto</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[20px] font-medium" style={{ color: 'rgba(245,245,255,0.45)' }}>S/</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              placeholder="0.00"
              className="bg-transparent border-none focus:outline-none tabular-nums text-center w-48"
              style={{
                fontSize: '40px',
                fontWeight: 700,
                color: form.amount ? accentColor : 'rgba(245,245,255,0.20)',
                letterSpacing: '-0.02em',
              }}
            />
          </div>
          {errors.amount && (
            <p className="text-[12px] mt-1" style={{ color: '#F87171' }}>{errors.amount}</p>
          )}
        </div>

        {/* Category chips */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2.5"
            style={{ color: 'rgba(245,245,255,0.35)' }}>Categoría</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const active = form.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium press transition-all"
                  style={{
                    background: active ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? `${accentColor}40` : 'rgba(255,255,255,0.09)'}`,
                    color: active ? accentColor : 'rgba(245,245,255,0.50)',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row: Date + Responsible */}
        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
              style={{ color: 'rgba(245,245,255,0.35)' }}>Fecha</p>
            <div className="relative">
              <div
                className="px-3 py-2.5 rounded-xl text-[14px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.date ? '#F87171' : 'rgba(255,255,255,0.09)'}`,
                  color: '#F5F5FF',
                }}
              >
                {formatDate(form.date)}
              </div>
              <input
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Responsible */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
              style={{ color: 'rgba(245,245,255,0.35)' }}>Responsable</p>
            <input
              type="text"
              value={form.responsible}
              onChange={e => update('responsible', e.target.value)}
              placeholder="Nombre"
              className="w-full px-3 py-2.5 rounded-xl text-[14px] bg-transparent focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.responsible ? '#F87171' : 'rgba(255,255,255,0.09)'}`,
                color: '#F5F5FF',
              }}
            />
            {errors.responsible && (
              <p className="text-[11px] mt-1" style={{ color: '#F87171' }}>{errors.responsible}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>
            Descripción <span className="normal-case" style={{ color: 'rgba(245,245,255,0.20)' }}>(opcional)</span>
          </p>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Detalles adicionales..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl text-[14px] bg-transparent focus:outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: '#F5F5FF',
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
          style={{
            background: submitting ? `${accentColor}80` : accentColor,
            transition: 'background 200ms',
          }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : `Registrar ${form.type}`}
        </button>
      </form>
    </BottomSheet>
  );
}
