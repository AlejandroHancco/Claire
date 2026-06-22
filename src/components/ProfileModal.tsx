'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, AVATAR_COLORS } from '@/lib/types';
import BottomSheet from '@/components/BottomSheet';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  currentProfile: Profile | null;
  userId: string;
  userEmail: string;
}

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function ProfileModal({ isOpen, onClose, onSave, currentProfile, userId, userEmail }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#A78BFA');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      setDisplayName(currentProfile.display_name);
      setAvatarColor(currentProfile.avatar_color);
    } else if (isOpen) {
      setDisplayName(userEmail.split('@')[0]);
      setAvatarColor('#A78BFA');
    }
  }, [isOpen, currentProfile, userEmail]);

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
      onSave({ id: userId, display_name: displayName.trim(), avatar_color: avatarColor });
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Mi perfil" snapHeight="80dvh">
      <div className="px-5 pb-8 space-y-6">

        {/* Avatar preview */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
            style={{
              background: `${avatarColor}22`,
              border: `2px solid ${avatarColor}55`,
              color: avatarColor,
            }}
          >
            {getInitials(displayName || 'U')}
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold" style={{ color: '#F5F5FF' }}>
              {displayName || 'Sin nombre'}
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{userEmail}</p>
          </div>
        </div>

        {/* Display name */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'rgba(245,245,255,0.35)' }}>Nombre para mostrar</p>
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

        {/* Color picker */}
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

        {/* Save */}
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
      </div>
    </BottomSheet>
  );
}
