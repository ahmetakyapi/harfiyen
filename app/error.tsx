'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

// Sayfalar force-dynamic ve her istekte Neon'a gidiyor; veritabanı uyanırken
// ya da env eksikken atılan hata eskiden Next'in çıplak İngilizce ekranına
// düşüyordu. Burada oyuncuya en azından bir çıkış ve yeniden deneme sunuluyor.
export default function ErrorBoundary({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  useEffect(() => {
    console.error('[harfiyen] sayfa hatası:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display-flourish bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text font-display text-4xl text-transparent">
        Bir Şeyler Ters Gitti
      </p>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        Baskı makinesi takıldı. Süren sunucuda güvende — oyuna kaldığın yerden dönebilirsin.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2">
        <button type="button" onClick={reset}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)] transition-transform active:scale-[0.98]">
          <RotateCcw aria-hidden className="h-4 w-4" /> Tekrar Dene
        </button>
        <Link href="/"
          className="flex min-h-11 items-center justify-center rounded-2xl border border-[var(--line)] text-sm font-medium">
          Ana Sayfa
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-[0.7rem] text-[var(--ink-soft)]">hata kodu: {error.digest}</p>
      )}
    </main>
  );
}
