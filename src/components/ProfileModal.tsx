'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, AVATAR_COLORS } from '@/lib/types';
import AvatarChip from '@/components/AvatarChip';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  currentProfile: Profile | null;
  userId: string;
  userEmail: string;
}

const inputClass =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-500';

const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider';

export default function ProfileModal({ isOpen, onClose, onSave, currentProfile, userId, userEmail }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentProfile) {
      setDisplayName(currentProfile.display_name);
      setAvatarColor(currentProfile.avatar_color);
    } else if (isOpen) {
      setDisplayName(userEmail.split('@')[0]);
      setAvatarColor('#6366f1');
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
      onClose();
    }
  };

  if (!isOpen) return null;

  const preview = { id: userId, display_name: displayName || 'Usuario', avatar_color: avatarColor };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[95dvh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-white">Configurar perfil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-4">
            <AvatarChip displayName={preview.display_name} avatarColor={preview.avatar_color} size="lg" showName={false} />
            <div>
              <p className="text-white font-medium">{preview.display_name || 'Usuario'}</p>
              <p className="text-gray-400 text-xs mt-0.5">{userEmail}</p>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className={labelClass}>Nombre para mostrar</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="Tu nombre"
              maxLength={40}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className={labelClass}>Color de avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => setAvatarColor(c.value)}
                  className="relative w-full aspect-square rounded-xl transition-transform hover:scale-110 focus:outline-none"
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

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
