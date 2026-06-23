'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import ProfileModal from '@/components/ProfileModal';
import toast from 'react-hot-toast';

interface HeaderProps {
  userEmail: string;
  currentProfile: Profile | null;
  userId: string;
  onNewTransaction: () => void;
  onProfileUpdate: (profile: Profile) => void;
}

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function Header({ userEmail, currentProfile, userId, onProfileUpdate }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'pink'>('dark');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Read initial theme from <html> class (applied server-side by layout.tsx)
    setTheme(document.documentElement.classList.contains('pink') ? 'pink' : 'dark');
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    router.push('/login');
    router.refresh();
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'pink' : 'dark';

    // Immediate visual update — no waiting for DB
    document.documentElement.classList.remove('dark', 'pink');
    document.documentElement.classList.add(newTheme);
    setTheme(newTheme);

    // Persist in cookie so layout.tsx reads it on next SSR
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `claire-theme=${newTheme}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax${secure}`;

    // Persist in Supabase profile in the background
    const supabase = createClient();
    await supabase.from('profiles').update({ theme: newTheme }).eq('id', userId);
  };

  const displayName = currentProfile?.display_name ?? userEmail.split('@')[0];
  const avatarColor = currentProfile?.avatar_color ?? '#A78BFA';
  const initials = getInitials(displayName);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5"
        style={{
          height: '52px',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--glass-bd)',
          transition: 'background 380ms ease, border-color 380ms ease',
        }}
      >
        {/* Wordmark */}
        <span className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>Claire</span>

        <div className="flex items-center gap-2">
          {/* Theme toggle: 🌸 in dark → switch to pink | 🌙 in pink → switch to dark */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center press"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-bd)',
              fontSize: '15px',
              transition: 'background 380ms ease, border-color 380ms ease',
            }}
            aria-label={theme === 'dark' ? 'Cambiar a tema rosa' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? '🌸' : '🌙'}
          </button>

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 press"
            >
              {currentProfile?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentProfile.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: `1.5px solid ${avatarColor}60` }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
                  style={{
                    background: `${avatarColor}26`,
                    border: `1.5px solid ${avatarColor}60`,
                    color: avatarColor,
                  }}
                >
                  {initials}
                </div>
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'var(--drop-bg)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  border: '1px solid var(--glass-bd)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--glass-bd)' }}>
                  <p className="text-[14px] font-medium truncate" style={{ color: '#F5F5FF' }}>{displayName}</p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>{userEmail}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); setProfileOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] press"
                    style={{ color: 'rgba(245,245,255,0.75)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(245,245,255,0.40)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Configurar perfil
                  </button>
                  <div style={{ borderTop: '1px solid var(--glass-bd)', margin: '4px 16px' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] press"
                    style={{ color: '#F87171' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSave={profile => { onProfileUpdate(profile); setProfileOpen(false); }}
        currentProfile={currentProfile}
        userId={userId}
        userEmail={userEmail}
      />
    </>
  );
}
