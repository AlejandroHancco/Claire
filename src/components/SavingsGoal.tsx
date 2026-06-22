'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SavingsGoal as SavingsGoalType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SavingsGoalProps {
  userId: string;
}

const inputClass =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-500';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider';

function ProgressBar({ percentage }: { percentage: number }) {
  const color =
    percentage >= 100 ? 'bg-emerald-400' :
    percentage >= 75 ? 'bg-emerald-500' :
    percentage >= 40 ? 'bg-sky-500' :
    percentage >= 20 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  );
}

// ─── Edit / Create goal modal ───────────────────────────────────────────────

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, target: number, deadline: string) => Promise<void>;
  initial?: SavingsGoalType | null;
}

function GoalModal({ isOpen, onClose, onSave, initial }: GoalModalProps) {
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
    if (!target || Number(target) <= 0) errs.target = 'Ingrese un monto válido';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    await onSave(title.trim(), Number(target), deadline);
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95dvh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-white">{initial ? 'Actualizar meta' : 'Crear primera meta'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Título de la meta</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`${inputClass} ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Ej: Vacaciones a Cancún"
              maxLength={80}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className={labelClass}>Monto objetivo (S/)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">S/</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className={`${inputClass} pl-10 ${errors.target ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
            </div>
            {errors.target && <p className="text-red-400 text-xs mt-1">{errors.target}</p>}
          </div>

          <div>
            <label className={labelClass}>Fecha límite <span className="text-gray-600 normal-case">(opcional)</span></label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className={inputClass}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Guardando...</>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add savings modal ───────────────────────────────────────────────────────

interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (amount: number) => Promise<void>;
  currentAmount: number;
  targetAmount: number;
}

function AddSavingsModal({ isOpen, onClose, onAdd, currentAmount, targetAmount }: AddSavingsModalProps) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const remaining = Math.max(0, targetAmount - currentAmount);

  useEffect(() => {
    if (isOpen) setAmount('');
  }, [isOpen]);

  const handleAdd = async () => {
    const n = Number(amount);
    if (!amount || n <= 0) return;
    setSaving(true);
    await onAdd(n);
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Añadir ahorro</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-xs text-gray-400 bg-gray-800/50 rounded-xl p-3 space-y-1">
            <div className="flex justify-between">
              <span>Acumulado:</span>
              <span className="text-gray-200">{formatCurrency(currentAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Falta:</span>
              <span className="text-gray-200">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Monto a añadir (S/)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">S/</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !amount || Number(amount) <= 0}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Añadiendo...</>
              ) : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main SavingsGoal component ─────────────────────────────────────────────

export default function SavingsGoal({ userId }: SavingsGoalProps) {
  const [goal, setGoal] = useState<SavingsGoalType | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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

  const handleAddSavings = async (amount: number) => {
    if (!goal) return;
    const supabase = createClient();
    const newAmount = Number(goal.current_amount) + amount;
    const { error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount })
      .eq('id', goal.id);

    if (error) { toast.error('Error al añadir ahorro'); return; }
    setGoal(prev => prev ? { ...prev, current_amount: newAmount } : prev);
    toast.success(`${formatCurrency(amount)} añadido al ahorro`);
    setAddOpen(false);
  };

  // Loading state
  if (goal === undefined) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-center min-h-[140px]">
        <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Empty state
  if (goal === null) {
    return (
      <>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[140px] text-center">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">Sin meta de ahorro</p>
            <p className="text-xs text-gray-500 mt-1">Creen juntos su primera meta</p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 px-4 py-1.5 rounded-lg transition-colors"
          >
            Crear primera meta
          </button>
        </div>
        <GoalModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSaveGoal} initial={null} />
      </>
    );
  }

  const current = Number(goal.current_amount);
  const target = Number(goal.target_amount);
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isComplete = percentage >= 100;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-amber-400/10 border border-amber-500/20 flex items-center justify-center">
              {isComplete ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Meta compartida</p>
              <p className="text-sm font-semibold text-white truncate">{goal.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setAddOpen(true)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 px-2.5 py-1 rounded-lg transition-colors"
            >
              + Añadir
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs font-medium text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-600 px-2.5 py-1 rounded-lg transition-colors"
            >
              Editar
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <ProgressBar percentage={percentage} />
          <div className="flex items-center justify-between text-xs">
            <span className={isComplete ? 'text-emerald-400 font-medium' : 'text-gray-300'}>
              {formatCurrency(current)}
              {isComplete && ' 🎉'}
            </span>
            <span className="text-gray-500">{formatCurrency(target)}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs">
          <span className={`font-semibold ${isComplete ? 'text-emerald-400' : percentage >= 50 ? 'text-sky-400' : 'text-amber-400'}`}>
            {percentage.toFixed(0)}% completado
          </span>
          {goal.deadline && (
            <span className="text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Meta: {formatDate(goal.deadline)}
            </span>
          )}
        </div>
      </div>

      <GoalModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSaveGoal} initial={goal} />
      <AddSavingsModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddSavings}
        currentAmount={current}
        targetAmount={target}
      />
    </>
  );
}
