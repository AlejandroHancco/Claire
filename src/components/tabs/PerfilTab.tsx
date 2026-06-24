'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, AVATAR_COLORS } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import AvatarCropModal from '@/components/AvatarCropModal';
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
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single shared client instance — same pattern as DashboardClient.
  // createBrowserClient reads the auth cookie on initialization; creating a
  // fresh instance right before each request can race against session hydration.
  const supabase = useMemo(() => createClient(), []);

  const [displayName, setDisplayName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#A78BFA');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setThemeState] = useState<'dark' | 'pink'>('dark');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // imageSrc for the crop modal (data URL); null = modal closed
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name);
      setAvatarColor(currentProfile.avatar_color);
      setAvatarUrl(currentProfile.avatar_url ?? null);
      setThemeState(currentProfile.theme === 'pink' ? 'pink' : 'dark');
    } else {
      setDisplayName(userEmail.split('@')[0]);
    }
  }, [currentProfile, userEmail]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: displayName.trim(),
      avatar_color: avatarColor,
    });
    setSaving(false);
    if (error) {
      toast.error(t('perfil_error'));
    } else {
      toast.success(t('perfil_exito'));
      onProfileUpdate({
        id: userId,
        display_name: displayName.trim(),
        avatar_color: avatarColor,
        avatar_url: avatarUrl,
        theme,
      });
    }
  };

  const handleThemeToggle = async (newTheme: 'dark' | 'pink') => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle('pink', newTheme === 'pink');
    await supabase.from('profiles').update({ theme: newTheme }).eq('id', userId);
    onProfileUpdate({
      id: userId,
      display_name: displayName.trim() || (currentProfile?.display_name ?? ''),
      avatar_color: avatarColor,
      avatar_url: avatarUrl,
      theme: newTheme,
    });
  };

  // Step 1: file selected → read as data URL → open crop modal
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input immediately so the same file can be re-selected after cancel
    if (fileInputRef.current) fileInputRef.current.value = '';
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: crop confirmed → upload blob → save URL
  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      // Guard: reject empty blobs before they hit the network
      if (!blob || blob.size === 0) throw new Error('Blob is empty');
      console.log('[avatar] uploading — size:', blob.size, 'type:', blob.type);

      // Confirm the shared client has an authenticated session before uploading
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[avatar] session present?', !!session, 'uid:', session?.user?.id);
      if (!session) throw new Error('No auth session — cannot upload');

      const path = `${userId}.jpg`;

      // @supabase/storage-js wraps Blob in FormData (multipart), which Supabase
      // Storage rejects. ArrayBuffer hits the raw-body branch → content-type: image/jpeg.
      const arrayBuffer = await blob.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('[avatar] sdk upload error:', uploadError);
        throw uploadError;
      }
      console.log('[avatar] upload OK:', uploadData);

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('[avatar] public url:', url);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);

      if (updateError) {
        console.error('[avatar] profile update error:', JSON.stringify(updateError));
        throw updateError;
      }

      setAvatarUrl(url);
      const name = displayName.trim() || (currentProfile?.display_name ?? '');
      onProfileUpdate({ id: userId, display_name: name, avatar_color: avatarColor, avatar_url: url, theme });
      toast.success(t('perfil_foto_exito'));
    } catch (err) {
      console.error('[avatar] handleCropConfirm failed:', err);
      toast.error(t('perfil_foto_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('perfil_sesion_cerrada'));
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(displayName || 'U');

  return (
    <>
      <div className="px-5 pb-8 space-y-5 pt-4">

        {/* Avatar with photo upload */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: `2px solid ${avatarColor}55` }}
              />
            ) : (
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
            )}

            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center press"
              style={{ background: '#A78BFA', border: '2px solid rgba(6,6,16,1)' }}
              aria-label="Cambiar foto"
            >
              {uploading ? (
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-[13px]" style={{ color: 'rgba(245,245,255,0.40)' }}>{userEmail}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>

        {/* Display name */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest mb-2"
            style={{ color: 'rgba(245,245,255,0.35)' }}>{t('perfil_nombre')}</p>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t('perfil_tu_nombre')}
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
            style={{ color: 'rgba(245,245,255,0.35)' }}>{t('perfil_color_avatar')}</p>
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
              {t('perfil_guardando')}
            </>
          ) : t('perfil_guardar')}
        </button>

        {/* Divider */}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Theme toggle */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{theme === 'pink' ? '🌸' : '🌙'}</span>
            <p className="text-[14px] font-medium" style={{ color: '#F5F5FF' }}>{t('perfil_tema')}</p>
          </div>
          <div
            className="flex gap-1 p-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => handleThemeToggle('dark')}
              className="px-3 py-1 rounded-full text-[13px] font-semibold press transition-all"
              style={{
                background: theme === 'dark' ? '#A78BFA' : 'transparent',
                color: theme === 'dark' ? '#fff' : 'rgba(245,245,255,0.45)',
              }}
            >
              🌙 {t('tema_oscuro')}
            </button>
            <button
              onClick={() => handleThemeToggle('pink')}
              className="px-3 py-1 rounded-full text-[13px] font-semibold press transition-all"
              style={{
                background: theme === 'pink' ? '#E91E8C' : 'transparent',
                color: theme === 'pink' ? '#fff' : 'rgba(245,245,255,0.45)',
              }}
            >
              🌸 {t('tema_rosa')}
            </button>
          </div>
        </div>

        {/* Language toggle */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌐</span>
            <p className="text-[14px] font-medium" style={{ color: '#F5F5FF' }}>{t('perfil_idioma')}</p>
          </div>
          <div
            className="flex gap-1 p-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {(['es', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3 py-1 rounded-full text-[13px] font-semibold press transition-all"
                style={{
                  background: lang === l ? '#A78BFA' : 'transparent',
                  color: lang === l ? '#fff' : 'rgba(245,245,255,0.45)',
                }}
              >
                {l === 'es' ? 'ES' : 'EN'}
              </button>
            ))}
          </div>
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
          {t('perfil_cerrar_sesion')}
        </button>
      </div>

      {/* Crop modal — mounts when an image is selected */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </>
  );
}
