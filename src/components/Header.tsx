'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import AvatarChip from '@/components/AvatarChip';
import ProfileModal from '@/components/ProfileModal';
import toast from 'react-hot-toast';

interface HeaderProps {
  userEmail: string;
  currentProfile: Profile | null;
  userId: string;
  onNewTransaction: () => void;
  onProfileUpdate: (profile: Profile) => void;
}

export default function Header({ userEmail, currentProfile, userId, onNewTransaction, onProfileUpdate }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    router.push('/login');
    router.refresh();
  };

  const handleProfileSave = (profile: Profile) => {
    onProfileUpdate(profile);
    setProfileModalOpen(false);
  };

  const displayName = currentProfile?.display_name ?? userEmail.split('@')[0];
  const avatarColor = currentProfile?.avatar_color ?? '#6366f1';

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-400">C</span>
              </div>
              <span className="text-lg font-bold text-white">Claire</span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={onNewTransaction}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva Transacción</span>
                <span className="sm:hidden">Nueva</span>
              </button>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <AvatarChip
                    displayName={displayName}
                    avatarColor={avatarColor}
                    size="sm"
                    showName={false}
                  />
                  <span className="hidden sm:block text-sm text-gray-300 max-w-[120px] truncate">{displayName}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    {/* Identity */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{userEmail}</p>
                    </div>

                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => { setDropdownOpen(false); setProfileModalOpen(true); }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Configurar perfil
                      </button>

                      <div className="border-t border-gray-800 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors"
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
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleProfileSave}
        currentProfile={currentProfile}
        userId={userId}
        userEmail={userEmail}
      />
    </>
  );
}
