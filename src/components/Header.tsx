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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const displayName = currentProfile?.display_name ?? userEmail.split('@')[0];
  const avatarColor = currentProfile?.avatar_color ?? '#A78BFA';
  const initials = getInitials(displayName);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5"
        style={{
          height: '52px',
          background: 'rgba(6,6,16,0.80)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Wordmark */}
        <span className="text-[17px] font-semibold" style={{ color: '#F5F5FF' }}>Claire</span>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 press"
          >
            {/* Avatar circle */}
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
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'rgba(18,18,32,0.95)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
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
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 16px' }} />
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
