'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, TransactionFilters, Profile, TransactionType } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import FiltersBar from '@/components/FiltersBar';
import TransactionModal from '@/components/TransactionModal';
import BottomNav, { TabKey } from '@/components/BottomNav';
import InicioTab from '@/components/tabs/InicioTab';
import PartnerTab from '@/components/tabs/PartnerTab';
import EstadisticasTab from '@/components/tabs/EstadisticasTab';
import PerfilTab from '@/components/tabs/PerfilTab';
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
  const { t } = useLanguage();

  // ── Single shared Supabase client instance ─────────────────────────────────
  // createBrowserClient is already a singleton internally, but we make that
  // explicit here so every call in this component (fetchData, handleDelete,
  // the realtime subscription, profile seeding) all share the exact same object.
  const supabase = useMemo(() => createClient(), []);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('Ingreso');
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [openHistory, setOpenHistory] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentProfile = useMemo(
    () => profiles.find(p => p.id === userId) ?? null,
    [profiles, userId]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filters.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters.dateTo && tx.date > filters.dateTo) return false;
      if (filters.type !== 'All' && tx.type !== filters.type) return false;
      if (filters.category !== 'All' && tx.category !== filters.category) return false;
      if (filters.responsible !== 'All' && tx.user_id !== filters.responsible) return false;
      return true;
    });
  }, [transactions, filters]);

  const currentMonthData = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(tx => tx.date.startsWith(monthKey));
    const ingresos = monthTx.filter(tx => tx.type === 'Ingreso').reduce((s, tx) => s + Number(tx.amount), 0);
    const egresos = monthTx.filter(tx => tx.type === 'Egreso').reduce((s, tx) => s + Number(tx.amount), 0);
    return { ingresos, egresos, balance: ingresos - egresos };
  }, [transactions]);

  const hasActiveFilters = useMemo(() =>
    !!(filters.dateFrom || filters.dateTo || filters.type !== 'All'
      || filters.category !== 'All' || filters.responsible !== 'All'),
    [filters]);

  // ── Central refetch — covers transactions, KPIs, charts, and partner totals ─
  // All tabs derive their data from `transactions` and `profiles` in state, so
  // a single refetch here propagates to InicioTab, PartnerTab, EstadisticasTab.
  const fetchData = useCallback(async () => {
    const [txResult, profilesResult] = await Promise.all([
      supabase.from('transactions').select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, avatar_color, avatar_url, theme'),
    ]);

    if (txResult.error) toast.error(t('error_cargar_tx'));

    // Build profile map from what RLS returns (may only be own profile)
    const profileMap: Record<string, Profile> = {};
    for (const p of profilesResult.data ?? []) {
      profileMap[p.id] = p;
    }

    // Fallback: reconstruct any missing profiles from transaction data.
    // If RLS on profiles restricts to own row, partner profiles are still
    // discoverable via their transactions (responsible = their display_name).
    const seenUserIds = new Set<string>();
    const txRows = txResult.data ?? [];
    for (const tx of txRows) {
      if (!seenUserIds.has(tx.user_id)) {
        seenUserIds.add(tx.user_id);
        if (!profileMap[tx.user_id]) {
          profileMap[tx.user_id] = {
            id: tx.user_id,
            display_name: tx.responsible ?? 'Partner',
            avatar_color: '#34D399',
          };
        }
      }
    }

    const profileArr = Object.values(profileMap);
    setProfiles(profileArr);

    const txWithProfiles: Transaction[] = txRows.map(tx => ({
      ...tx,
      profile: profileMap[tx.user_id] ?? null,
    }));

    setTransactions(txWithProfiles);
    setLoading(false);
  // supabase is stable (useMemo []); t is intentionally omitted to avoid
  // re-subscribing the realtime channel on every language change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Initial fetch on mount
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  // Use the same `supabase` instance as everything else. Empty deps so the
  // channel is created once and torn down on unmount — not on every render.
  // `fetchData` is stable (useCallback with stable deps), so it's safe to
  // capture in the closure without listing it as a dep.
  const fetchDataRef = useRef(fetchData);
  useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => { fetchDataRef.current(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // supabase is stable; fetchDataRef.current used for the callback

  // Apply theme from profile to <html> and sync theme-color meta tag
  useEffect(() => {
    const isPink = currentProfile?.theme === 'pink';
    document.documentElement.classList.toggle('pink', isPink);
    const themeColor = isPink ? '#F9D0E0' : '#0D0D1A';
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', themeColor);
    });
  }, [currentProfile?.theme]);

  // Auto-seed profile if missing
  useEffect(() => {
    if (!loading && profiles.length > 0 && !profiles.find(p => p.id === userId)) {
      supabase.from('profiles').upsert({
        id: userId,
        display_name: userEmail.split('@')[0],
        avatar_color: '#A78BFA',
      }).then(() => fetchData());
    }
  }, [loading, profiles, userId, userEmail, fetchData, supabase]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      toast.error(t('error_eliminar'));
    } else {
      toast.success(t('exito_eliminado'));
      // Optimistic update — realtime subscription will confirm
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleSuccess = useCallback(() => {
    setModalOpen(false);
    // Explicit refetch for immediate feedback; realtime subscription also fires
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

  const handleAdd = useCallback(() => {
    setTransactionType('Ingreso');
    setModalOpen(true);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Phone frame outline on desktop */}
      <div className="phone-frame-outline" />

      {/* 390px centered column */}
      <div className="max-w-[390px] mx-auto min-h-dvh relative flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Scrollable tab content */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(68px + env(safe-area-inset-bottom) + 12px + 16px)' }}
        >
          {activeTab === 'inicio' && (
            <InicioTab
              filteredTransactions={filteredTransactions}
              currentMonthData={currentMonthData}
              loading={loading}
              userId={userId}
              profiles={profiles}
              onDelete={handleDelete}
              onFilterTap={() => setFiltersOpen(true)}
              hasActiveFilters={hasActiveFilters}
              onViewAll={() => { setActiveTab('estadisticas'); setOpenHistory(true); }}
            />
          )}

          {activeTab === 'partner' && (
            <PartnerTab
              profiles={profiles}
              transactions={transactions}
              userId={userId}
            />
          )}

          {activeTab === 'estadisticas' && (
            <EstadisticasTab
              transactions={transactions}
              userId={userId}
              theme={currentProfile?.theme === 'pink' ? 'pink' : 'dark'}
              openHistory={openHistory}
              onHistoryOpened={() => setOpenHistory(false)}
            />
          )}

          {activeTab === 'perfil' && (
            <PerfilTab
              userId={userId}
              userEmail={userEmail}
              currentProfile={currentProfile}
              onProfileUpdate={handleProfileUpdate}
            />
          )}
        </main>
      </div>

      {/* Bottom navigation with embedded FAB */}
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        onAdd={handleAdd}
      />

      {/* Transaction form sheet */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        defaultType={transactionType}
        displayName={currentProfile?.display_name}
      />

      {/* Filters sheet */}
      <FiltersBar
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        transactions={transactions}
        filters={filters}
        onChange={setFilters}
        profiles={profiles}
      />
    </>
  );
}
