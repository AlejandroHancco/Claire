'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export type TabKey = 'inicio' | 'partner' | 'estadisticas' | 'perfil';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  onAdd: () => void;
}

function HomeIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.03 2.59a1.5 1.5 0 011.94 0l7.5 6.363A1.5 1.5 0 0121 10.097V19.5A1.5 1.5 0 0119.5 21h-4a1.5 1.5 0 01-1.5-1.5v-4h-4v4A1.5 1.5 0 018.5 21h-4A1.5 1.5 0 013 19.5v-9.403a1.5 1.5 0 01.53-1.147l7.5-6.363z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.218l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

const LEFT_TABS: { key: TabKey; icon: (a: { active: boolean }) => JSX.Element; labelKey: 'tab_inicio' | 'tab_partner' }[] = [
  { key: 'inicio', icon: HomeIcon, labelKey: 'tab_inicio' },
  { key: 'partner', icon: HeartIcon, labelKey: 'tab_partner' },
];

const RIGHT_TABS: { key: TabKey; icon: (a: { active: boolean }) => JSX.Element; labelKey: 'tab_stats' | 'tab_perfil' }[] = [
  { key: 'estadisticas', icon: ChartIcon, labelKey: 'tab_stats' },
  { key: 'perfil', icon: UserIcon, labelKey: 'tab_perfil' },
];

export default function BottomNav({ activeTab, onChange, onAdd }: BottomNavProps) {
  const { t } = useLanguage();

  return (
    <nav
      className="fixed z-40 flex items-stretch"
      style={{
        bottom: 0,
        left: 'max(0px, calc(50vw - 195px))',
        width: 'min(390px, 100vw)',
        height: 'calc(68px + env(safe-area-inset-bottom))',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        boxShadow: 'var(--nav-shadow)',
      }}
    >
      {/* Left tabs */}
      {LEFT_TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center justify-center gap-1 press"
            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)', transition: 'color 180ms ease' }}
          >
            <tab.icon active={active} />
            <span className="text-[10px] font-medium" style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}>{t(tab.labelKey)}</span>
          </button>
        );
      })}

      {/* Center FAB */}
      <div className="flex-1 flex flex-col items-center justify-start pt-0 relative">
        <button
          onClick={onAdd}
          className="press flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg, var(--fab-from) 0%, var(--fab-to) 100%)',
            boxShadow: '0 4px 20px var(--fab-shadow)',
            marginTop: '-28px',
          }}
          aria-label="Nueva transacción"
        >
          <svg width="22" height="22" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Right tabs */}
      {RIGHT_TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center justify-center gap-1 press"
            style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)', transition: 'color 180ms ease' }}
          >
            <tab.icon active={active} />
            <span className="text-[10px] font-medium" style={{ color: active ? 'var(--nav-active)' : 'var(--nav-inactive)' }}>{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
