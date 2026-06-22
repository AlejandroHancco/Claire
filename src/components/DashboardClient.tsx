'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, TransactionFilters, Profile, TransactionType } from '@/lib/types';
import Header from '@/components/Header';
import HeroCard from '@/components/HeroCard';
import KPICards from '@/components/KPICards';
import FiltersBar from '@/components/FiltersBar';
import ChartsSection from '@/components/ChartsSection';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionModal from '@/components/TransactionModal';
import SavingsGoal from '@/components/SavingsGoal';
import MonthlyNote from '@/components/MonthlyNote';
import BottomSheet from '@/components/BottomSheet';
import FAB from '@/components/FAB';
import toast from 'react-hot-toast';

interface DashboardClientProps {
  userEmail: string;
  userId: string;
}

const defaultFilters: TransactionFilters = {
  dateFrom: '',
  dateTo: '',
  type: 'All',
  category: 'All',
  responsible: 'All',
};

export default function DashboardClient({ userEmail, userId }: DashboardClientProps) {
  // ── Existing data state (untouched) ────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);

  // ── New UI state ────────────────────────────────────────────────────────────
  const [statsOpen, setStatsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('Ingreso');

  // ── Derived: current profile (untouched) ───────────────────────────────────
  const currentProfile = useMemo(
    () => profiles.find(p => p.id === userId) ?? null,
    [profiles, userId]
  );

  // ── Data fetching (untouched) ───────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const [txResult, profilesResult] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('id, display_name, avatar_color'),
    ]);

    if (txResult.error) toast.error('Error al cargar las transacciones');

    const profileArr: Profile[] = profilesResult.data ?? [];
    setProfiles(profileArr);

    const profileMap = Object.fromEntries(profileArr.map(p => [p.id, p]));

    const txWithProfiles: Transaction[] = (txResult.data ?? []).map(tx => ({
      ...tx,
      profile: profileMap[tx.user_id] ?? null,
    }));

    setTransactions(txWithProfiles);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-seed profile if missing (untouched)
  useEffect(() => {
    if (!loading && profiles.length > 0 && !profiles.find(p => p.id === userId)) {
      const supabase = createClient();
      supabase.from('profiles').upsert({
        id: userId,
        display_name: userEmail.split('@')[0],
        avatar_color: '#A78BFA',
      }).then(() => fetchData());
    }
  }, [loading, profiles, userId, userEmail, fetchData]);

  // ── Derived filtered data (untouched) ─────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      if (filters.type !== 'All' && t.type !== filters.type) return false;
      if (filters.category !== 'All' && t.category !== filters.category) return false;
      if (filters.responsible !== 'All' && t.responsible !== filters.responsible) return false;
      return true;
    });
  }, [transactions, filters]);

  // ── Current month data for hero card ──────────────────────────────────────
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(t => t.date.startsWith(monthKey));
    const ingresos = monthTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0);
    const egresos = monthTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0);
    return { ingresos, egresos, balance: ingresos - egresos };
  }, [transactions]);

  const hasActiveFilters = useMemo(() =>
    !!(filters.dateFrom || filters.dateTo || filters.type !== 'All'
      || filters.category !== 'All' || filters.responsible !== 'All'),
    [filters]);

  // ── Handlers (untouched) ───────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar la transacción');
    } else {
      toast.success('Transacción eliminada');
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setModalOpen(false);
    fetchData();
  }, [fetchData]);

  const handleProfileUpdate = useCallback((updated: Profile) => {
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Phone frame outline on desktop */}
      <div className="phone-frame-outline" />

      {/* 390px centered column */}
      <div className="max-w-[390px] mx-auto min-h-dvh relative">
        {/* Sticky header */}
        <Header
          userEmail={userEmail}
          currentProfile={currentProfile}
          userId={userId}
          onNewTransaction={() => { setTransactionType('Ingreso'); setModalOpen(true); }}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Scrollable content */}
        <main className="pb-28 space-y-3">
          {/* Hero balance card */}
          <HeroCard
            ingresos={currentMonthData.ingresos}
            egresos={currentMonthData.egresos}
            balance={currentMonthData.balance}
            loading={loading}
          />

          {/* KPI chips */}
          <KPICards transactions={filteredTransactions} />

          {/* Savings goal compact */}
          <SavingsGoal userId={userId} />

          {/* Monthly notes side-by-side */}
          <MonthlyNote userId={userId} profiles={profiles} />

          {/* Section divider */}
          <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Transactions list */}
          <TransactionsTable
            transactions={filteredTransactions}
            onDelete={handleDelete}
            loading={loading}
            onFilterTap={() => setFiltersOpen(true)}
            onStatsTap={() => setStatsOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </main>
      </div>

      {/* FAB */}
      <FAB
        onIngreso={() => { setTransactionType('Ingreso'); setModalOpen(true); }}
        onEgreso={() => { setTransactionType('Egreso'); setModalOpen(true); }}
      />

      {/* Transaction form sheet */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        defaultType={transactionType}
      />

      {/* Stats sheet */}
      <BottomSheet isOpen={statsOpen} onClose={() => setStatsOpen(false)} title="Estadísticas" snapHeight="90dvh">
        <ChartsSection transactions={filteredTransactions} />
      </BottomSheet>

      {/* Filters sheet */}
      <FiltersBar
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        transactions={transactions}
        filters={filters}
        onChange={setFilters}
      />
    </>
  );
}
