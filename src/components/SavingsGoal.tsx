'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SavingsGoal as SavingsGoalType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import BottomSheet from '@/components/BottomSheet';
import toast from 'react-hot-toast';

interface SavingsGoalProps {
  userId: string;
  monthBalance: number;
}

// ─── Edit / Create goal sheet ────────────────────────────────────────────────

interface GoalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, target: number, deadline: string) => Promise<void>;
  initial?: SavingsGoalType | null;
}

function GoalSheet({ isOpen, onClose, onSave, initial }: GoalSheetProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; target?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title ?? '');
      setTarget(initial?.target_amount ? String(initial.target_amount) : '');
      setDeadline(initial?.deadline ?? '');
      setErrors({});
    }
  }, [isOpen, initial]);

  const handleSave = async () => {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'Requerido';
    if (!target || Number(target) <= 0) errs.target = 'Monto inválido';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await onSave(title.trim(), Number(target), deadline);
    setSaving(false);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={initial ? 'Actualizar meta' : 'Nueva meta'} snapHeight="80dvh">
      <div className="px-5 pb-8 space-y-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>Título</p>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Vacaciones en Cusco"
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl text-[15px] bg-transparent focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${errors.title ? '#F87171' : 'rgba(255,255,255,0.09)'}`,
              color: '#F5F5FF',
            }}
          />
          {errors.title && <p className="text-[12px] mt-1" style={{ color: '#F87171' }}>{errors.title}</p>}
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>Monto objetivo</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium"
              style={{ color: 'rgba(245,245,255,0.40)' }}>S/</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-[15px] bg-transparent focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.target ? '#F87171' : 'rgba(255,255,255,0.09)'}`,
                color: '#F5F5FF',
              }}
            />
          </div>
          {errors.target && <p className="text-[12px] mt-1" style={{ color: '#F87171' }}>{errors.target}</p>}
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>
            Fecha límite <span className="normal-case" style={{ color: 'rgba(245,245,255,0.20)' }}>(opcional)</span>
          </p>
          <div className="relative">
            <div
              className="px-4 py-3 rounded-xl text-[15px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: deadline ? '#F5F5FF' : 'rgba(245,245,255,0.30)',
              }}
            >
              {deadline ? formatDate(deadline) : 'Seleccionar fecha'}
            </div>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
          style={{ background: saving ? 'rgba(167,139,250,0.50)' : '#A78BFA' }}
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('perfil_guardando')}
            </>
          ) : 'Guardar'}
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Main SavingsGoal component ─────────────────────────────────────────────

export default function SavingsGoal({ userId, monthBalance }: SavingsGoalProps) {
  const { t } = useLanguage();
  const [goal, setGoal] = useState<SavingsGoalType | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const fetchGoal = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setGoal(data ?? null);
  }, []);

  useEffect(() => { fetchGoal(); }, [fetchGoal]);

  const handleSaveGoal = async (title: string, target: number, deadline: string) => {
    const supabase = createClient();

    if (goal) {
      const { error } = await supabase
        .from('savings_goals')
        .update({ title, target_amount: target, deadline: deadline || null })
        .eq('id', goal.id);
      if (error) { toast.error('Error al actualizar la meta'); return; }
      setGoal(prev => prev ? { ...prev, title, target_amount: target, deadline: deadline || null } : prev);
    } else {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ title, target_amount: target, current_amount: 0, deadline: deadline || null, created_by: userId })
        .select()
        .single();
      if (error) { toast.error('Error al crear la meta'); return; }
      setGoal(data);
    }

    toast.success(goal ? 'Meta actualizada' : 'Meta creada');
    setEditOpen(false);
  };

  // Loading skeleton
  if (goal === undefined) {
    return (
      <div className="mx-4 h-16 rounded-2xl animate-pulse"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
    );
  }

  // Empty state — prompt to create a goal
  if (goal === null) {
    return (
      <>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl press"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px dashed rgba(255,255,255,0.12)',
            marginLeft: '1rem',
            marginRight: '1rem',
            width: 'calc(100% - 2rem)',
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
            <span style={{ color: '#A78BFA', fontSize: 16 }}>◎</span>
          </div>
          <span className="text-[14px]" style={{ color: 'rgba(245,245,255,0.35)' }}>
            Crear meta de ahorro compartida…
          </span>
        </button>
        <GoalSheet isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSaveGoal} initial={null} />
      </>
    );
  }

  // Progress is driven live by the current month's net balance
  const current = Math.max(0, monthBalance);
  const target = Number(goal.target_amount);
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isComplete = percentage >= 100;
  const barColor = isComplete ? '#34D399' : percentage >= 50 ? '#A78BFA' : '#F59E0B';

  return (
    <>
      <div
        className="mx-4 rounded-2xl px-4 py-3.5 space-y-2.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[16px]">{isComplete ? '🎉' : '◎'}</span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>{goal.title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>
                {t('hero_balance')}: {formatCurrency(current)} / {formatCurrency(target)}
                {goal.deadline && ` · ${formatDate(goal.deadline)}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium press flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(245,245,255,0.45)',
            }}
          >
            Editar
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, percentage)}%`, background: barColor, transition: 'width 700ms ease' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] font-medium" style={{ color: barColor }}>
              {Math.min(100, percentage).toFixed(0)}%
            </span>
            {isComplete && (
              <span className="text-[11px] font-medium" style={{ color: '#34D399' }}>
                {t('meta_alcanzada')}
              </span>
            )}
          </div>
        </div>
      </div>

      <GoalSheet isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSaveGoal} initial={goal} />
    </>
  );
}
