'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, AVATAR_COLORS } from '@/lib/types';
import toast from 'react-hot-toast';

interface PerfilTabProps {
  userId: string;
  userEmail: string;
  currentProfile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
}

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function PerfilTab({ userId, userEmail, currentProfile, onProfileUpdate }: PerfilTabProps) {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#A78BFA');
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'pink'>('dark');
  const router = useRouter();

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('pink') ? 'pink' : 'dark');
  }, []);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name);
      setAvatarColor(currentProfile.avatar_color);
    } else {
      setDisplayName(userEmail.split('@')[0]);
    }
  }, [currentProfile, userEmail]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: displayName.trim(),
      avatar_color: avatarColor,
    });
    setSaving(false);
    if (error) {
      toast.error('Error al guardar el perfil');
    } else {
      toast.success('Perfil actualizado');
      onProfileUpdate({ id: userId, display_name: displayName.trim(), avatar_color: avatarColor });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'pink' : 'dark';
    document.documentElement.classList.remove('dark', 'pink');
    document.documentElement.classList.add(newTheme);
    setTheme(newTheme);
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `claire-theme=${newTheme}; max-age=${60 * 60 * 24 * 30}; path=/; samesite=lax${secure}`;
    const supabase = createClient();
    supabase.from('profiles').update({ theme: newTheme }).eq('id', userId);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(displayName || 'U');

  return (
    <div className="px-5 pb-8 space-y-5 pt-4">

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold"
          style={{
            background: `${avatarColor}22`,
            border: `2px solid ${avatarColor}55`,
            color: avatarColor,
          }}
        >
          {initials}
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{userEmail}</p>
      </div>

      {/* Display name */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
          style={{ color: 'rgba(245,245,255,0.35)' }}>Nombre</p>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Tu nombre"
          maxLength={40}
          className="w-full bg-transparent px-4 py-3 rounded-xl text-[15px] focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#F5F5FF',
          }}
        />
      </div>

      {/* Avatar color picker */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
          style={{ color: 'rgba(245,245,255,0.35)' }}>Color de avatar</p>
        <div className="grid grid-cols-6 gap-3">
          {AVATAR_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => setAvatarColor(c.value)}
              className="relative aspect-square rounded-full press"
              style={{ backgroundColor: c.value }}
            >
              {avatarColor === c.value && (
                <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !displayName.trim()}
        className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2"
        style={{
          background: saving || !displayName.trim() ? 'rgba(167,139,250,0.40)' : '#A78BFA',
          transition: 'background 200ms',
        }}
      >
        {saving ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </>
        ) : 'Guardar perfil'}
      </button>

      {/* Divider */}
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Theme toggle */}
      <div
        className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{theme === 'dark' ? '🌙' : '🌸'}</span>
          <div>
            <p className="text-[14px] font-medium" style={{ color: '#F5F5FF' }}>
              Tema {theme === 'dark' ? 'oscuro' : 'rosa'}
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(245,245,255,0.35)' }}>
              Toca para cambiar
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="relative w-12 h-6 rounded-full press flex-shrink-0"
          style={{
            background: theme === 'pink' ? '#f43f5e' : '#A78BFA',
            transition: 'background 300ms ease',
          }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
            style={{
              left: theme === 'pink' ? '26px' : '2px',
              transition: 'left 300ms ease',
            }}
          />
        </button>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full h-[52px] rounded-full text-[15px] font-semibold press flex items-center justify-center gap-2"
        style={{
          background: 'rgba(248,113,113,0.10)',
          border: '1px solid rgba(248,113,113,0.20)',
          color: '#F87171',
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Cerrar sesión
      </button>
    </div>
  );
}
