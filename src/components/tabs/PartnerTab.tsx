'use client';

import { useMemo } from 'react';
import { Transaction, Profile } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';

interface PartnerTabProps {
  profiles: Profile[];
  transactions: Transaction[];
  userId: string;
}

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

interface ProfileStats {
  count: number;
  ingreso: number;
  egreso: number;
  balance: number;
}

function computeStats(profile: Profile, transactions: Transaction[]): ProfileStats {
  const userTx = transactions.filter(t => t.user_id === profile.id);
  const ingreso = userTx.filter(t => t.type === 'Ingreso').reduce((s, t) => s + Number(t.amount), 0);
  const egreso = userTx.filter(t => t.type === 'Egreso').reduce((s, t) => s + Number(t.amount), 0);
  return { count: userTx.length, ingreso, egreso, balance: ingreso - egreso };
}

function ProfileCard({ profile, stats, isMe, labels }: {
  profile: Profile;
  stats: ProfileStats;
  isMe: boolean;
  labels: { yo: string; movimientos: string; ingresos: string; egresos: string; balance: string };
}) {
  const initials = getInitials(profile.display_name);
  const balancePositive = stats.balance >= 0;

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: isMe ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isMe ? 'rgba(167,139,250,0.20)' : 'rgba(255,255,255,0.09)'}`,
      }}
    >
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-2 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-16 h-16 rounded-full object-cover"
            style={{ border: `2px solid ${profile.avatar_color}55` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold"
            style={{
              background: `${profile.avatar_color}22`,
              border: `2px solid ${profile.avatar_color}55`,
              color: profile.avatar_color,
            }}
          >
            {initials}
          </div>
        )}
        <div className="text-center">
          <p className="text-[14px] font-semibold" style={{ color: '#F5F5FF' }}>
            {profile.display_name}
          </p>
          {/* Always render the badge slot so both card headers are the same height */}
          {isMe ? (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>
              {labels.yo}
            </span>
          ) : (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full"
              style={{ visibility: 'hidden' }}>
              {labels.yo}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{labels.movimientos}</span>
          <span className="text-[13px] font-semibold" style={{ color: '#F5F5FF' }}>{stats.count}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{labels.ingresos}</span>
          <span className="text-[13px] font-semibold" style={{ color: '#34D399' }}>{formatCurrency(stats.ingreso)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{labels.egresos}</span>
          <span className="text-[13px] font-semibold" style={{ color: '#F87171' }}>{formatCurrency(stats.egreso)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 mt-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[12px] font-medium" style={{ color: 'rgba(245,245,255,0.55)' }}>{labels.balance}</span>
          <span className="text-[14px] font-bold tabular-nums"
            style={{ color: balancePositive ? '#F5F5FF' : '#F87171' }}>
            {balancePositive ? '' : '−'}{formatCurrency(Math.abs(stats.balance))}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ esperando, sinUsuario }: { esperando: string; sinUsuario: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[200px]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}
    >
      <span className="text-3xl">💕</span>
      <div className="text-center">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(245,245,255,0.45)' }}>{esperando}</p>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(245,245,255,0.25)' }}>{sinUsuario}</p>
      </div>
    </div>
  );
}

export default function PartnerTab({ profiles, transactions, userId }: PartnerTabProps) {
  const { t } = useLanguage();

  const myProfile = useMemo(() => profiles.find(p => p.id === userId) ?? null, [profiles, userId]);
  const partnerProfile = useMemo(() => profiles.find(p => p.id !== userId) ?? null, [profiles, userId]);
  const myStats = useMemo(() => myProfile ? computeStats(myProfile, transactions) : null, [myProfile, transactions]);
  const partnerStats = useMemo(() => partnerProfile ? computeStats(partnerProfile, transactions) : null, [partnerProfile, transactions]);

  const totalIngreso = transactions.filter(tx => tx.type === 'Ingreso').reduce((s, tx) => s + Number(tx.amount), 0);
  const totalEgreso = transactions.filter(tx => tx.type === 'Egreso').reduce((s, tx) => s + Number(tx.amount), 0);

  const cardLabels = {
    yo: t('partner_yo'),
    movimientos: t('partner_movimientos'),
    ingresos: t('partner_ingresos'),
    egresos: t('partner_egresos'),
    balance: t('partner_balance'),
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-4">
      <div>
        <h2 className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>{t('partner_titulo')}</h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>{t('partner_subtitulo')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        {myProfile && myStats ? (
          <ProfileCard profile={myProfile} stats={myStats} isMe={true} labels={cardLabels} />
        ) : (
          <EmptyCard esperando={t('partner_esperando')} sinUsuario={t('partner_sin_usuario')} />
        )}
        {partnerProfile && partnerStats ? (
          <ProfileCard profile={partnerProfile} stats={partnerStats} isMe={false} labels={cardLabels} />
        ) : (
          <EmptyCard esperando={t('partner_esperando')} sinUsuario={t('partner_sin_usuario')} />
        )}
      </div>

      {/* Combined totals */}
      <div
        className="rounded-2xl px-4 py-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <p className="text-[11px] font-medium uppercase tracking-widest"
          style={{ color: 'rgba(245,245,255,0.35)' }}>{t('partner_combinados')}</p>
        <div className="flex gap-3">
          <div className="flex-1 text-center py-2 rounded-xl"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <p className="text-[11px]" style={{ color: '#34D399' }}>↑ {t('partner_ingresos')}</p>
            <p className="text-[14px] font-bold mt-0.5" style={{ color: '#34D399' }}>{formatCurrency(totalIngreso)}</p>
          </div>
          <div className="flex-1 text-center py-2 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
            <p className="text-[11px]" style={{ color: '#F87171' }}>↓ {t('partner_egresos')}</p>
            <p className="text-[14px] font-bold mt-0.5" style={{ color: '#F87171' }}>{formatCurrency(totalEgreso)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
