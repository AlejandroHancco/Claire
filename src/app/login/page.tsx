'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Credenciales inválidas. Intente de nuevo.');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-5"
      style={{ background: 'radial-gradient(ellipse 140% 80% at 50% -10%, #0D0D1A 0%, #060610 65%)' }}
    >
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)' }} />

      <div className="w-full max-w-[320px]">
        {/* Wordmark */}
        <div className="text-center mb-4">
          <Image src="/logoinvisibleClaire.png" width={64} height={64} className="mb-3 mx-auto" alt="" />          <h1 className="text-[34px] font-bold tracking-tight" style={{ color: '#F5F5FF' }}>Claire</h1>

        </div>

        {/* Glass card */}
        <div
          className="rounded-[24px] p-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-3"
                     style={{ color: 'rgba(245,245,255,0.40)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent text-[15px] pb-3 focus:outline-none"
                style={{
                  color: '#F5F5FF',
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                }}
                placeholder="nombre@ejemplo.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-3"
                     style={{ color: 'rgba(245,245,255,0.40)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent text-[15px] pb-3 focus:outline-none"
                style={{
                  color: '#F5F5FF',
                  borderBottom: '1px solid rgba(255,255,255,0.15)',
                }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-[13px]"
                style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.20)', color: '#F87171' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-full text-[15px] font-semibold text-white press flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading ? 'rgba(167,139,250,0.50)' : '#A78BFA',
                transition: 'background 200ms',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
