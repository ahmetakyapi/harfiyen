'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'harfiyen:howto-seen';

export function HowToModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) !== '1') setOpen(true);
  }, []);
  if (!open) return null;
  const close = (): void => {
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--paper-raised)] p-6">
        <p className="font-display text-2xl">Harfiyen&apos;e Hoş Geldin</p>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          İpuçlarından kelimeleri bul, kesişimleri kullan. Süre &quot;Başla&quot; deyince başlar;
          doğru biten kelime yeşil yanar. Takılırsan ipucu alabilirsin (+15 sn).
        </p>
        <p className="mt-2 text-sm">
          <Link href="/how-to-play" className="underline" onClick={close}>Ayrıntılı Anlatım</Link>
        </p>
        <button type="button" onClick={close}
          className="mt-5 w-full rounded-lg bg-[var(--ink)] py-2.5 font-medium text-[var(--paper)]">
          Anladım, Başlayalım
        </button>
      </div>
    </div>
  );
}
