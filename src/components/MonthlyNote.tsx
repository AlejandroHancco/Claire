'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MonthlyNote as MonthlyNoteType, Profile } from '@/lib/types';
import AvatarChip from '@/components/AvatarChip';
import toast from 'react-hot-toast';

interface MonthlyNoteProps {
  userId: string;
  profiles: Profile[];
}

const MAX_CHARS = 300;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MonthlyNote({ userId, profiles }: MonthlyNoteProps) {
  const [myNote, setMyNote] = useState('');
  const [partnerNote, setPartnerNote] = useState<MonthlyNoteType | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const currentMonth = getCurrentMonth();
  const monthLabel = capitalizeFirst(getMonthLabel());

  const myProfile = profiles.find(p => p.id === userId);
  const partnerProfile = partnerNote ? profiles.find(p => p.id === partnerNote.user_id) : null;

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('monthly_notes')
      .select('*')
      .eq('month', currentMonth);

    const notes = data ?? [];
    const mine = notes.find(n => n.user_id === userId);
    const partner = notes.find(n => n.user_id !== userId) ?? null;

    setMyNote(mine?.note ?? '');
    setPartnerNote(partner);
    setLoaded(true);
  }, [userId, currentMonth]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('monthly_notes').upsert(
      { user_id: userId, month: currentMonth, note: text },
      { onConflict: 'user_id,month' }
    );

    setSaving(false);
    if (error) {
      toast.error('Error al guardar la nota');
    } else {
      setLastSaved(new Date());
    }
  }, [userId, currentMonth]);

  const handleChange = (val: string) => {
    if (val.length > MAX_CHARS) return;
    setMyNote(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(val), 800);
  };

  const handleBlur = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    save(myNote);
  };

  const formatLastSaved = (d: Date): string => {
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-violet-400/10 border border-violet-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Nota del mes</p>
            <p className="text-sm font-semibold text-white truncate">
              {myProfile?.display_name ?? 'Yo'} — {monthLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && (
            <svg className="animate-spin w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {!saving && lastSaved && (
            <span className="text-xs text-gray-600">
              Guardado {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>
      </div>

      {/* My note textarea */}
      <div className="relative">
        <textarea
          value={myNote}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={loaded ? 'Escribe tu nota del mes...' : ''}
          disabled={!loaded}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder-gray-600 disabled:opacity-50"
          rows={4}
          maxLength={MAX_CHARS}
        />
        <span className={`absolute bottom-3 right-3 text-xs ${myNote.length >= MAX_CHARS ? 'text-red-400' : myNote.length >= MAX_CHARS * 0.85 ? 'text-amber-400' : 'text-gray-600'}`}>
          {myNote.length}/{MAX_CHARS}
        </span>
      </div>

      {/* Partner note */}
      {partnerNote && partnerNote.note && (
        <div className="border-t border-gray-800 pt-4 space-y-2.5">
          <div className="flex items-center gap-2">
            {partnerProfile ? (
              <AvatarChip
                displayName={partnerProfile.display_name}
                avatarColor={partnerProfile.avatar_color}
                size="xs"
                showName={false}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />
            )}
            <span className="text-xs text-gray-400">
              {partnerProfile?.display_name ?? 'Tu pareja'} — {monthLabel}
            </span>
            <span className="ml-auto text-xs text-gray-600">Solo lectura</span>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{partnerNote.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
