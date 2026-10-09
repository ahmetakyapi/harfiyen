'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { readFlag, writeFlag } from '@/lib/storage';
import { KineticTitle } from '@/components/motion/KineticTitle';

const SEEN_KEY = 'harfiyen:howto-seen';

export function HowToModal({ forceOpen = false, onClose }: {
  /** Oyun ekranındaki "?" düğmesi bunu elle açar — modal bir kez kapatıldıktan
   *  sonra localStorage yüzünden bir daha hiç görünmüyordu. */
  forceOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const [open, setOpen] = useState(forceOpen);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (forceOpen) return;
    // localStorage'a DOKUNMAK bile site verisi engellenmiş tarayıcılarda
    // istisna atar; korumasız çağrı /play'i daha oyun başlamadan çökertiyordu.
    if (!readFlag(SEEN_KEY)) setOpen(true);
  }, [forceOpen]);

  const close = useCallback((): void => {
    writeFlag(SEEN_KEY);
    setOpen(false);
    onClose?.();
  }, [onClose]);

  // Escape ile kapanma + odak tuzağı: modal'ın karşılaması gereken asgari
  // klavye/ekran okuyucu sözleşmesi.
  useFocusTrap(panelRef, open);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Harfiyen'e hoş geldin"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--overlay)] p-4 backdrop-blur-sm">
      <div ref={panelRef} className="my-auto w-full max-w-sm rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper-raised)] p-6 shadow-2xl">
        <KineticTitle as="p" text="Harfiyen'e Hoş Geldin"
          className="font-display-flourish font-display text-[1.75rem] leading-tight tracking-tight" />
        <ul className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
          <li>İpuçlarından kelimeleri bul, kesişimleri kullan. Doğru biten kelime yeşil yanar.</li>
          <li>Hücreye dokununca kelime seçilir; aynı hücreye ikinci dokunuş yönü değiştirir.</li>
          <li>Takılırsan harf aç (+15 sn) — açılan harf köşesinde turuncu işaretle kilitlenir.</li>
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
