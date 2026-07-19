'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Yalnızca site-içi göreli yollara izin verilir — açık yönlendirme (open
// redirect) riskine karşı ("//evil.com" gibi protokol-göreli yollar reddedilir).
function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (mode === 'register') {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Kayıt başarısız.');
        setBusy(false);
        return;
      }
    }
    const result = await signIn('credentials', { username, password, redirect: false });
    setBusy(false);
    if (result?.error) setError('Kullanıcı adı veya şifre hatalı.');
    else { router.push(safeNext(next)); router.refresh(); }
  }

  return (
    <form onSubmit={submit}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-sm">
      <label className="flex flex-col gap-1 text-sm">
        Kullanıcı adı
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLocaleLowerCase('tr-TR'))}
          autoComplete="username"
          className="min-h-11 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2"
          required minLength={3} maxLength={20}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Şifre
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          className="min-h-11 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2"
          required minLength={8}
        />
      </label>
      {mode === 'register' && (
        <p className="text-xs text-[var(--ink-soft)]">
          E-posta istemiyoruz; bu yüzden şifreni unutursan kurtaramayız. Güvenli bir yere not et.
        </p>
      )}
      {error && <p className="text-sm text-[var(--accent)]">{error}</p>}
      <button type="submit" disabled={busy}
        className="min-h-11 rounded-lg bg-[var(--ink)] py-2 font-medium text-[var(--paper)] disabled:opacity-50">
        {mode === 'register' ? 'Üye ol' : 'Giriş yap'}
      </button>
    </form>
  );
}
