'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TransactionType, INGRESO_CATEGORIES, EGRESO_CATEGORIES } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTodayString, formatDate } from '@/lib/utils';
import BottomSheet from '@/components/BottomSheet';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: TransactionType;
  displayName?: string;
}

interface FormState {
  date: string;
  type: TransactionType;
  category: string;
  amount: string;
  description: string;
}

const initialForm = (type: TransactionType = 'Ingreso'): FormState => ({
  date: getTodayString(),
  type,
  category: (type === 'Ingreso' ? INGRESO_CATEGORIES : EGRESO_CATEGORIES)[0],
  amount: '',
  description: '',
});

export default function TransactionModal({ isOpen, onClose, onSuccess, defaultType, displayName }: TransactionModalProps) {
  const { t, tCat } = useLanguage();
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
    if (!form.amount || Number(form.amount) <= 0) errs.amount = t('modal_monto_valido');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const responsible = displayName ?? user?.email?.split('@')[0] ?? 'Usuario';

    const { error } = await supabase.from('transactions').insert({
      user_id: user!.id,
      date: form.date,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      description: form.description.trim() || null,
      responsible,
    });

    setSubmitting(false);

    if (error) {
      toast.error(t('modal_error'));
    } else {
      toast.success(t('modal_exito'));
      onSuccess();
    }
  };

  const isIngreso = form.type === 'Ingreso';
  const accentColor = isIngreso ? 'var(--color-ingreso)' : 'var(--color-egreso)';
  const accentRaw = isIngreso ? '#34D399' : '#F87171';

  return (
      <BottomSheet isOpen={isOpen} onClose={onClose} snapHeight="92dvh">
        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-5">

          {/* Type selector */}
          <div className="flex gap-2 p-1 rounded-full"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {(['Ingreso', 'Egreso'] as TransactionType[]).map(tp => {
              const active = form.type === tp;
              const color = tp === 'Ingreso' ? 'var(--color-ingreso)' : 'var(--color-egreso)';
              const colorRaw = tp === 'Ingreso' ? '#34D399' : '#F87171';
              return (
                  <button
                      key={tp}
                      type="button"
                      onClick={() => update('type', tp)}
                      className="flex-1 py-3 rounded-full text-[15px] font-semibold transition-all duration-200 press"
                      style={{
                        background: active ? `${colorRaw}20` : 'transparent',
                        color: active ? color : 'var(--text-muted)',
                        border: active ? `1px solid ${colorRaw}40` : '1px solid transparent',
                      }}
                  >
                    {tp === 'Ingreso' ? t('modal_ingreso_btn') : t('modal_egreso_btn')}
                  </button>
              );
            })}
          </div>

          {/* Amount */}
          <div className="text-center py-2">
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
               style={{ color: 'var(--text-muted)' }}>{t('modal_monto')}</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-[20px] font-medium" style={{ color: 'var(--text-muted)' }}>S/</span>
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
                    color: form.amount ? accentColor : 'var(--text-muted)',
                    letterSpacing: '-0.02em',
                  }}
              />
            </div>
            {errors.amount && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--color-egreso)' }}>{errors.amount}</p>
            )}
          </div>

          {/* Category chips */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2.5"
               style={{ color: 'var(--text-muted)' }}>{t('modal_categoria')}</p>
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
                          background: active ? `${accentRaw}20` : 'var(--surface)',
                          border: `1px solid ${active ? `${accentRaw}40` : 'var(--border)'}`,
                          color: active ? accentColor : 'var(--text-secondary)',
                        }}
                    >
                      {tCat(cat)}
                    </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
               style={{ color: 'var(--text-muted)' }}>{t('modal_fecha')}</p>
            <div className="relative">
              <div
                  className="px-3 py-2.5 rounded-xl text-[14px] font-medium"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${errors.date ? 'var(--color-egreso)' : 'var(--border)'}`,
                    color: 'var(--text-primary)',
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

          {/* Description */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
               style={{ color: 'var(--text-muted)' }}>
              {t('modal_descripcion')}{' '}
              <span className="normal-case" style={{ color: 'var(--text-muted)' }}>{t('modal_opcional')}</span>
            </p>
            <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder={t('modal_detalles')}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-[14px] bg-transparent focus:outline-none resize-none"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
            />
          </div>

          {/* Submit */}
          <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
              style={{
                background: submitting ? `${accentRaw}80` : accentColor,
                transition: 'background 200ms',
              }}
          >
            {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('modal_guardando')}
                </>
            ) : `${t('modal_registrar')} ${isIngreso ? t('tipo_ingreso') : t('tipo_egreso')}`}
          </button>
        </form>
      </BottomSheet>
  );
}