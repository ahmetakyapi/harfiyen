'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'harfiyen:howto-seen';

export function HowToModal() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) !== '1') setOpen(true);
  }, []);

  const close = (): void => {
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };

  // Escape ile kapanma + açılışta odak: modal'ın karşılaması gereken asgari
  // klavye/ekran okuyucu sözleşmesi.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Harfiyen'e hoş geldin"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-sm rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-2xl">
        <p className="bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text font-display text-2xl text-transparent">
          Harfiyen&apos;e Hoş Geldin
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
          <li>İpuçlarından kelimeleri bul, kesişimleri kullan. Doğru biten kelime yeşil yanar.</li>
          <li>
            Harfleri ekranın altındaki <strong className="font-semibold text-[var(--ink)]">Türkçe klavyeden</strong> gir —
            29 harfin tamamı tek dokunuşta, telefonun klavyesi hiç açılmaz.
          </li>
          <li>Hücreye dokununca kelime seçilir; aynı hücreye ikinci dokunuş yönü değiştirir.</li>
          <li>Takılırsan ipucu al (+15 sn) — açılan harf köşesinde turuncu işaretle kilitlenir.</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link href="/how-to-play" className="underline" onClick={close}>Ayrıntılı Anlatım</Link>
        </p>
        <button type="button" onClick={close} ref={closeRef}
          className="mt-5 min-h-12 w-full rounded-xl bg-[var(--ink)] font-medium text-[var(--paper)] transition-transform duration-150 active:scale-[0.98]">
          Anladım, Başlayalım
        </button>
      </div>
    </div>
  );
}
