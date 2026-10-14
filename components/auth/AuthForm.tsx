'use client';

import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { normalizeUsername } from '@/lib/tr';

// Yalnızca site-içi göreli yollara izin verilir — açık yönlendirme (open
// redirect) riskine karşı ("//evil.com" gibi protokol-göreli yollar reddedilir).
function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

// Odakta çerçeve vurgu rengine döner ve hafifçe "kalkar".
const INPUT = 'min-h-11 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 transition-[border-color,box-shadow] duration-300 focus:border-[var(--accent)] focus:shadow-[0_8px_24px_-16px_var(--accent)]';

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Şifre kurtarma yok: yanlış yazılmış bir şifreyle açılan hesap kalıcı
  // olarak kaybolur. Telefonda yazdığını görebilmek bu riski en ucuz kesen şey.
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();

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
        // Gövde JSON olmayabilir (500/429): korumasız res.json() burada
        // reject edip setBusy(false)'a hiç ulaşmıyordu — kullanıcı hiçbir
        // mesaj görmeden kilitli bir düğmeyle kalıyordu.
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Kayıt başarısız. Biraz sonra tekrar dene.');
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
      className="deal mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-[0_28px_70px_-48px_var(--ink)]"
      style={{ '--i': 1 } as React.CSSProperties}>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor={`${id}-user`}>Kullanıcı Adı</label>
        <input id={`${id}-user`}
          value={username}
          onChange={(e) => setUsername(normalizeUsername(e.target.value))}
          autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          aria-describedby={mode === 'register' ? `${id}-user-hint` : undefined}
          className={INPUT}
          required minLength={3} maxLength={20}
        />
        {/* Kuralı hata gelmeden söyle: "neden olmadı" sorusunun cevabı
            eskiden ancak gönderdikten sonra geliyordu. */}
        {mode === 'register' && (
          <p id={`${id}-user-hint`} className="text-xs text-[var(--ink-soft)]">
            3–20 karakter: a-z, rakam ve alt çizgi. Türkçe harf kullanılamaz.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor={`${id}-pass`}>Şifre</label>
        <div className="relative">
          <input id={`${id}-pass`}
            type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className={`${INPUT} w-full pr-12`}
            required minLength={8}
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'} aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]">
            {showPassword ? <EyeOff aria-hidden className="h-[18px] w-[18px]" /> : <Eye aria-hidden className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
      {mode === 'register' && (
        <p className="text-xs text-[var(--ink-soft)]">
          E-posta istemiyoruz; bu yüzden şifreni unutursan kurtaramayız. Güvenli bir yere not et.
        </p>
      )}
      {/* Hata, yanlış kelime gibi kısa bir sarsıntıyla gelir. */}
      {error && <p role="alert" key={error} className="form-error text-sm text-[var(--wrong)]">{error}</p>}
      <button type="submit" disabled={busy}
        className="btn-wipe flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--ink)] py-2 font-medium text-[var(--paper)] disabled:opacity-50">
        {busy && <span aria-hidden className="spinner" />}
        {mode === 'register' ? 'Üye Ol' : 'Giriş Yap'}
      </button>
    </form>
  );
}
