'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, TransactionFilters, Profile } from '@/lib/types';
import Header from '@/components/Header';
import KPICards from '@/components/KPICards';
import FiltersBar from '@/components/FiltersBar';
import ChartsSection from '@/components/ChartsSection';
import TransactionsTable from '@/components/TransactionsTable';
import TransactionModal from '@/components/TransactionModal';
import SavingsGoal from '@/components/SavingsGoal';
import MonthlyNote from '@/components/MonthlyNote';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);

  const currentProfile = useMemo(
    () => profiles.find(p => p.id === userId) ?? null,
    [profiles, userId]
  );

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

  // If no profile exists for current user, seed a default one and re-fetch
  useEffect(() => {
    if (!loading && profiles.length > 0 && !profiles.find(p => p.id === userId)) {
      const supabase = createClient();
      supabase.from('profiles').upsert({
        id: userId,
        display_name: userEmail.split('@')[0],
        avatar_color: '#6366f1',
      }).then(() => fetchData());
    }
  }, [loading, profiles, userId, userEmail, fetchData]);

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

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        userEmail={userEmail}
        currentProfile={currentProfile}
        userId={userId}
        onNewTransaction={() => setModalOpen(true)}
        onProfileUpdate={handleProfileUpdate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <KPICards transactions={filteredTransactions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SavingsGoal userId={userId} />
          <MonthlyNote userId={userId} profiles={profiles} />
        </div>

        <FiltersBar
          transactions={transactions}
          filters={filters}
          onChange={setFilters}
        />
        <ChartsSection transactions={filteredTransactions} />
        <TransactionsTable
          transactions={filteredTransactions}
          onDelete={handleDelete}
          loading={loading}
        />
      </main>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
