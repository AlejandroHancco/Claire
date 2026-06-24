'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { Lang } from '@/lib/i18n';
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

  // Single shared client — same pattern as DashboardClient
  const supabase = useMemo(() => createClient(), []);

  const [displayName, setDisplayName] = useState('');
  const [lastSavedName, setLastSavedName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [theme, setThemeState] = useState<'dark' | 'pink'>('dark');
  const [nameSaving, setNameSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // avatar_color is kept as a fallback for the initials circle; no longer editable
  const avatarColor = currentProfile?.avatar_color ?? '#A78BFA';

  useEffect(() => {
    if (currentProfile) {
      setDisplayName(currentProfile.display_name);
      setLastSavedName(currentProfile.display_name);
      setAvatarUrl(currentProfile.avatar_url ?? null);
      setThemeState(currentProfile.theme === 'pink' ? 'pink' : 'dark');
    } else {
      const fallback = userEmail.split('@')[0];
      setDisplayName(fallback);
      setLastSavedName(fallback);
    }
  }, [currentProfile, userEmail]);

  const nameDirty = displayName.trim() !== lastSavedName.trim() && !!displayName.trim();

  // ── Name save ─────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameDirty || nameSaving) return;
    setNameSaving(true);
    const trimmed = displayName.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', userId);
    setNameSaving(false);
    if (error) {
      toast.error(t('perfil_error'));
    } else {
      setLastSavedName(trimmed);
      toast.success(t('perfil_exito'));
      onProfileUpdate({
        id: userId,
        display_name: trimmed,
        avatar_color: avatarColor,
        avatar_url: avatarUrl,
        theme,
      });
    }
  };

  // ── Theme toggle (auto-saves) ──────────────────────────────────
  const handleThemeToggle = async (newTheme: 'dark' | 'pink') => {
    if (newTheme === theme) return;
    setThemeState(newTheme);
    document.documentElement.classList.toggle('pink', newTheme === 'pink');
    const themeColor = newTheme === 'pink' ? '#F9D0E0' : '#0D0D1A';
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', themeColor);
    });
    onProfileUpdate({
      id: userId,
      display_name: displayName.trim() || lastSavedName,
      avatar_color: avatarColor,
      avatar_url: avatarUrl,
      theme: newTheme,
    });
    const { error } = await supabase.from('profiles').update({ theme: newTheme }).eq('id', userId);
    if (!error) {
      toast.success(newTheme === 'dark' ? `🌙 ${t('tema_oscuro')}` : `🌸 ${t('tema_rosa')}`, { duration: 1500 });
    }
  };

  // ── Language change (auto-saves) ───────────────────────────────
  const handleLangChange = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    toast.success(l === 'es' ? '🇵🇪 Español' : '🇺🇸 English', { duration: 1500 });
    // Background save — requires: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT
    supabase.from('profiles').update({ language: l }).eq('id', userId).then(() => {
      onProfileUpdate({
        id: userId,
        display_name: displayName.trim() || lastSavedName,
        avatar_color: avatarColor,
        avatar_url: avatarUrl,
        theme,
        language: l,
      });
    });
  };

  // ── Photo upload ───────────────────────────────────────────────
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      if (!blob || blob.size === 0) throw new Error('Blob is empty');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const path = `${userId}.jpg`;

      // @supabase/storage-js wraps Blob in FormData; ArrayBuffer hits the raw-body branch
      const arrayBuffer = await blob.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      onProfileUpdate({ id: userId, display_name: displayName.trim() || lastSavedName, avatar_color: avatarColor, avatar_url: url, theme });
      toast.success(t('perfil_foto_exito'));
    } catch {
      toast.error(t('perfil_foto_error'));
    } finally {
      setUploading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('perfil_sesion_cerrada'));
    router.push('/login');
    router.refresh();
  };

  const initials = getInitials(displayName || 'U');

  return (
    <>
      <div className="px-4 pb-10 pt-5 space-y-4">

        {/* ── Avatar + identity ──────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="relative">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-[88px] h-[88px] rounded-full object-cover"
                style={{ border: `2.5px solid ${avatarColor}55` }}
              />
            ) : (
              <div
                className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-[28px] font-semibold"
                style={{
                  background: `${avatarColor}22`,
                  border: `2.5px solid ${avatarColor}55`,
                  color: avatarColor,
                }}
              >
                {initials}
              </div>
            )}

            {/* Camera overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center press"
              style={{ background: 'var(--accent)', border: '2px solid var(--app-bg, #060610)' }}
              aria-label={t('perfil_cambiar_foto')}
            >
              {uploading ? (
                <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-[16px] font-semibold" style={{ color: '#F5F5FF' }}>
              {displayName || '—'}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,255,0.40)' }}>
              {userEmail}
            </p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
        </div>

        {/* ── Display name ───────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 pt-3 pb-1">
            <p className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: 'rgba(245,245,255,0.35)' }}>
              {t('perfil_nombre')}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 pb-1">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
              placeholder={t('perfil_tu_nombre')}
              maxLength={40}
              className="flex-1 bg-transparent py-2.5 text-[15px] focus:outline-none"
              style={{ color: '#F5F5FF' }}
            />

            {/* Save indicator — visible when name has unsaved changes */}
            {nameDirty && (
              <button
                onClick={handleSaveName}
                disabled={nameSaving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold press flex-shrink-0"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {nameSaving ? (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {t('perfil_guardar')}
              </button>
            )}
          </div>
        </div>

        {/* ── Preferences ────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: 'rgba(245,245,255,0.35)' }}>
              {t('perfil_preferencias')}
            </p>
          </div>

          {/* Theme row */}
          <div className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <p className="text-[14px] font-medium" style={{ color: '#F5F5FF' }}>{t('perfil_tema')}</p>
            <div className="flex gap-0.5 p-1 rounded-full" style={{ background: 'var(--surface-el)' }}>
              <button
                onClick={() => handleThemeToggle('dark')}
                className="px-3 py-1 rounded-full text-[12px] font-semibold press transition-all"
                style={{
                  background: theme === 'dark' ? 'var(--accent)' : 'transparent',
                  color: theme === 'dark' ? '#fff' : 'var(--text-muted)',
                }}
              >
                🌙 {t('tema_oscuro')}
              </button>
              <button
                onClick={() => handleThemeToggle('pink')}
                className="px-3 py-1 rounded-full text-[12px] font-semibold press transition-all"
                style={{
                  background: theme === 'pink' ? 'var(--accent)' : 'transparent',
                  color: theme === 'pink' ? '#fff' : 'var(--text-muted)',
                }}
              >
                🌸 {t('tema_rosa')}
              </button>
            </div>
          </div>

          {/* Language row */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium" style={{ color: '#F5F5FF' }}>{t('perfil_idioma')}</p>
            <div className="flex gap-0.5 p-1 rounded-full" style={{ background: 'var(--surface-el)' }}>
              {(['es', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className="px-3 py-1 rounded-full text-[12px] font-semibold press transition-all"
                  style={{
                    background: lang === l ? 'var(--accent)' : 'transparent',
                    color: lang === l ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {l === 'es' ? 'ES' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Logout ─────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full h-[50px] rounded-2xl text-[15px] font-semibold press flex items-center justify-center gap-2"
          style={{
            background: 'rgba(248,113,113,0.09)',
            border: '1px solid rgba(248,113,113,0.18)',
            color: '#F87171',
          }}
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('perfil_cerrar_sesion')}
        </button>

      </div>

      {/* Crop modal */}
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
