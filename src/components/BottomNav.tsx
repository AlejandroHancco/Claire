'use client';

export type TabKey = 'inicio' | 'partner' | 'estadisticas' | 'perfil';

interface BottomNavProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'partner', label: 'Partner' },
  { key: 'estadisticas', label: 'Stats' },
  { key: 'perfil', label: 'Perfil' },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H5a1 1 0 01-1-1V9.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  );
}

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="12" width="4" height="9" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
      <rect x="10" y="7" width="4" height="14" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
      <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.8} />
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const ICONS = {
  inicio: HomeIcon,
  partner: HeartIcon,
  estadisticas: ChartIcon,
  perfil: UserIcon,
};

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav
      className="fixed z-40 flex"
      style={{
        bottom: 0,
        left: 'max(0px, calc(50vw - 195px))',
        width: 'min(390px, 100vw)',
        height: 'calc(56px + env(safe-area-inset-bottom))',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.25)',
      }}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        const Icon = ICONS[tab.key];
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 press"
            style={{
              color: active ? '#A78BFA' : 'rgba(245,245,255,0.35)',
              transition: 'color 180ms ease',
            }}
          >
            <Icon active={active} />
            <span className="text-[10px] font-medium" style={{ letterSpacing: '0.01em' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
