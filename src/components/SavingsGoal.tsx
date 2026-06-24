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

interface GoalSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, target: number, deadline: string) => Promise<void>;
    onReset?: () => Promise<void>;
    initial?: SavingsGoalType | null;
}

function GoalSheet({ isOpen, onClose, onSave, onReset, initial }: GoalSheetProps) {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
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
        if (!title.trim()) errs.title = t('meta_requerido');
        if (!target || Number(target) <= 0) errs.target = t('meta_monto_invalido');
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setSaving(true);
        await onSave(title.trim(), Number(target), deadline);
        setSaving(false);
    };

    const handleReset = async () => {
        if (!onReset) return;
        setResetting(true);
        await onReset();
        setResetting(false);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={initial ? t('meta_actualizar') : t('meta_nueva')} snapHeight="80dvh">
            <div className="px-5 pb-8 space-y-5">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
                       style={{ color: 'var(--text-muted)' }}>{t('meta_titulo_label')}</p>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ej: Vacaciones en Cusco"
                        maxLength={80}
                        className="w-full px-4 py-3 rounded-xl text-[15px] bg-transparent focus:outline-none"
                        style={{
                            background: 'var(--surface)',
                            border: `1px solid ${errors.title ? 'var(--color-egreso)' : 'var(--border)'}`,
                            color: 'var(--text-primary)',
                        }}
                    />
                    {errors.title && <p className="text-[12px] mt-1" style={{ color: 'var(--color-egreso)' }}>{errors.title}</p>}
                </div>

                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
                       style={{ color: 'var(--text-muted)' }}>{t('meta_monto_objetivo')}</p>
                    <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium"
                  style={{ color: 'var(--text-muted)' }}>S/</span>
                        <input
                            inputMode="decimal"
                            pattern="[0-9]*"
                            type="number"
                            min="1"
                            step="0.01"
                            value={target}
                            onChange={e => setTarget(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-[15px] bg-transparent focus:outline-none"
                            style={{
                                background: 'var(--surface)',
                                border: `1px solid ${errors.target ? 'var(--color-egreso)' : 'var(--border)'}`,
                                color: 'var(--text-primary)',
                            }}
                        />
                    </div>
                    {errors.target && <p className="text-[12px] mt-1" style={{ color: 'var(--color-egreso)' }}>{errors.target}</p>}
                </div>

                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
                       style={{ color: 'var(--text-muted)' }}>
                        {t('meta_fecha_limite')} <span className="normal-case" style={{ color: 'var(--text-muted)' }}>{t('meta_fecha_opcional')}</span>
                    </p>
                    <div className="relative">
                        <div
                            className="px-4 py-3 rounded-xl text-[15px]"
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                color: deadline ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                        >
                            {deadline ? formatDate(deadline) : t('meta_seleccionar_fecha')}
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

                {initial && onReset && (
                    <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="w-full py-3 rounded-full text-[14px] font-medium press"
                        style={{
                            background: 'rgba(248,113,113,0.10)',
                            border: '1px solid rgba(248,113,113,0.20)',
                            color: 'var(--color-egreso)',
                        }}
                    >
                        {resetting ? t('perfil_guardando') : t('meta_eliminar')}
                    </button>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
                    style={{ background: saving ? 'var(--accent-soft)' : 'var(--accent)' }}
                >
                    {saving ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('perfil_guardando')}
                        </>
                    ) : t('meta_guardar')}
                </button>
            </div>
        </BottomSheet>
    );
}

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
            if (error) { toast.error(t('meta_error_actualizar')); return; }
            setGoal(prev => prev ? { ...prev, title, target_amount: target, deadline: deadline || null } : prev);
        } else {
            const { data, error } = await supabase
                .from('savings_goals')
                .insert({ title, target_amount: target, current_amount: 0, deadline: deadline || null, created_by: userId })
                .select()
                .single();
            if (error) { toast.error(t('meta_error_crear')); return; }
            setGoal(data);
        }

        toast.success(goal ? t('meta_exito_actualizar') : t('meta_exito_crear'));
        setEditOpen(false);
    };

    const handleResetGoal = async () => {
        if (!goal) return;
        const supabase = createClient();
        const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', goal.id);
        if (error) { toast.error('Error al eliminar la meta'); return; }
        setGoal(null);
        setEditOpen(false);
    };

    if (goal === undefined) {
        return (
            <div className="mx-4 h-16 rounded-2xl animate-pulse"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
        );
    }

    if (goal === null) {
        return (
            <>
                <button
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl press"
                    style={{
                        background: 'var(--surface)',
                        border: '1px dashed var(--border)',
                        marginLeft: '1rem',
                        marginRight: '1rem',
                        width: 'calc(100% - 2rem)',
                    }}
                >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
                        <span style={{ color: 'var(--accent)', fontSize: 16 }}>◎</span>
                    </div>
                    <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {t('meta_crear')}
          </span>
                </button>
                <GoalSheet isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={handleSaveGoal} initial={null} />
            </>
        );
    }

    const current = Math.max(0, monthBalance);
    const target = Number(goal.target_amount);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isComplete = percentage >= 100;
    const barGradient = isComplete
        ? 'linear-gradient(90deg, var(--color-ingreso), var(--color-ingreso))'
        : 'linear-gradient(90deg, var(--accent), var(--accent-border))';

    return (
        <>
            <div
                className="mx-4 rounded-2xl px-4 py-3.5 space-y-2.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[16px]">{isComplete ? '🎉' : '◎'}</span>
                        <div className="min-w-0">
                            <p className="text-[14px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{goal.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {goal.deadline && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {t('meta_hasta')} {formatDate(goal.deadline)}
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setEditOpen(true)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium press flex-shrink-0"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        {t('meta_editar')}
                    </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {t('meta_progreso')}
            </span>
                        <span className="text-[11px] font-bold tx-amount" style={{ color: isComplete ? 'var(--color-ingreso)' : 'var(--accent)' }}>
              {Math.min(100, percentage).toFixed(0)}%
            </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, percentage)}%`, background: barGradient, transition: 'width 700ms ease' }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(current)} {t('meta_ahorrado')}
            </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {t('meta_objetivo')}: {formatCurrency(target)}
            </span>
                    </div>
                    {isComplete && (
                        <p className="text-[12px] font-medium text-center tx-amount" style={{ color: 'var(--color-ingreso)' }}>
                            {t('meta_alcanzada')}
                        </p>
                    )}
                </div>
            </div>

            <GoalSheet
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                onSave={handleSaveGoal}
                onReset={handleResetGoal}
                initial={goal}
            />
        </>
    );
}