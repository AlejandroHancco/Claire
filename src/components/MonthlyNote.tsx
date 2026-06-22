'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MonthlyNote as MonthlyNoteType, Profile } from '@/lib/types';
import BottomSheet from '@/components/BottomSheet';
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

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function MonthlyNote({ userId, profiles }: MonthlyNoteProps) {
  const [myNote, setMyNote] = useState('');
  const [partnerNote, setPartnerNote] = useState<MonthlyNoteType | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mySheetOpen, setMySheetOpen] = useState(false);
  const [partnerSheetOpen, setPartnerSheetOpen] = useState(false);
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

  const myName = myProfile?.display_name ?? 'Yo';
  const partnerName = partnerProfile?.display_name ?? 'Tu pareja';
  const myColor = myProfile?.avatar_color ?? '#A78BFA';
  const partnerColor = partnerProfile?.avatar_color ?? '#6366F1';

  return (
    <>
      {/* Side-by-side compact cards */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* My note card */}
        <button
          onClick={() => setMySheetOpen(true)}
          className="flex flex-col gap-2 px-3 py-3 rounded-2xl text-left press"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid rgba(255,255,255,0.09)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold"
              style={{ background: `${myColor}22`, color: myColor }}
            >
              {getInitials(myName)}
            </div>
            <span className="text-[12px] font-medium truncate" style={{ color: 'rgba(245,245,255,0.60)' }}>
              {myName}
            </span>
            {saving && (
              <svg className="animate-spin w-3 h-3 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24"
                style={{ color: 'rgba(245,245,255,0.30)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
          <p
            className="text-[12px] leading-relaxed line-clamp-3"
            style={{ color: myNote ? 'rgba(245,245,255,0.70)' : 'rgba(245,245,255,0.25)' }}
          >
            {loaded ? (myNote || 'Toca para escribir…') : ''}
          </p>
        </button>

        {/* Partner note card */}
        <button
          onClick={() => setPartnerSheetOpen(true)}
          className="flex flex-col gap-2 px-3 py-3 rounded-2xl text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: partnerNote?.note ? 'pointer' : 'default',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-semibold"
              style={{ background: `${partnerColor}22`, color: partnerColor }}
            >
              {getInitials(partnerName)}
            </div>
            <span className="text-[12px] font-medium truncate" style={{ color: 'rgba(245,245,255,0.45)' }}>
              {partnerName}
            </span>
          </div>
          <p
            className="text-[12px] leading-relaxed line-clamp-3"
            style={{ color: partnerNote?.note ? 'rgba(245,245,255,0.55)' : 'rgba(245,245,255,0.20)' }}
          >
            {partnerNote?.note || 'Sin nota aún'}
          </p>
        </button>
      </div>

      {/* My note editor sheet */}
      <BottomSheet isOpen={mySheetOpen} onClose={() => { handleBlur(); setMySheetOpen(false); }} title={`Mi nota · ${monthLabel}`} snapHeight="75dvh">
        <div className="px-5 pb-8 space-y-4">
          <div className="relative">
            <textarea
              value={myNote}
              onChange={e => handleChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={loaded ? 'Escribe tu nota del mes…' : ''}
              disabled={!loaded}
              rows={8}
              maxLength={MAX_CHARS}
              className="w-full bg-transparent px-4 py-3 rounded-xl text-[15px] resize-none focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: '#F5F5FF',
                lineHeight: 1.6,
              }}
              autoFocus
            />
            <span
              className="absolute bottom-3 right-3 text-[11px]"
              style={{ color: myNote.length >= MAX_CHARS ? '#F87171' : myNote.length >= MAX_CHARS * 0.85 ? '#F59E0B' : 'rgba(245,245,255,0.25)' }}
            >
              {myNote.length}/{MAX_CHARS}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {saving && (
              <div className="flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  style={{ color: 'rgba(245,245,255,0.35)' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.35)' }}>Guardando…</span>
              </div>
            )}
            {!saving && lastSaved && (
              <span className="text-[12px]" style={{ color: 'rgba(245,245,255,0.30)' }}>
                Guardado {lastSaved.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <button
            onClick={() => { handleBlur(); setMySheetOpen(false); }}
            className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press"
            style={{ background: '#A78BFA' }}
          >
            Listo
          </button>
        </div>
      </BottomSheet>

      {/* Partner note read-only sheet */}
      {partnerNote?.note && (
        <BottomSheet isOpen={partnerSheetOpen} onClose={() => setPartnerSheetOpen(false)} title={`Nota de ${partnerName} · ${monthLabel}`} snapHeight="70dvh">
          <div className="px-5 pb-8">
            <div
              className="px-4 py-4 rounded-xl text-[15px] leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(245,245,255,0.80)',
              }}
            >
              {partnerNote.note}
            </div>
            <p className="text-[12px] mt-3 text-center" style={{ color: 'rgba(245,245,255,0.25)' }}>
              Solo lectura
            </p>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
