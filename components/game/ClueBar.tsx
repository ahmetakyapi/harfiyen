'use client';

import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import type { Entry } from '@/lib/types';

const DIR_LABEL = { across: 'Soldan sağa', down: 'Yukarıdan aşağıya' } as const;

// Tüm butonlarda onPointerDown preventDefault: gizli input'un odağı düşmesin,
// mobilde native klavye açık kalsın (odak kaybı klavyeyi kapatır).
const keepFocus = (e: React.PointerEvent): void => e.preventDefault();

export function ClueBar({ entry, onPrev, onNext, onToggleDir, onClearWord }: {
  entry: Entry; onPrev: () => void; onNext: () => void; onToggleDir: () => void; onClearWord: () => void;
}) {
  return (
    // sticky: native klavye açıkken kaydırılsa da ipucu şeridi görünür kalır
    <div className="sticky bottom-3 z-30 flex min-h-14 items-stretch gap-1 rounded-2xl bg-[var(--ink)] pl-1 pr-1 text-[var(--paper)] shadow-[0_14px_34px_-22px_var(--ink)]">
      <button type="button" onClick={onPrev} onPointerDown={keepFocus} aria-label="Önceki ipucu"
        className="flex min-w-11 items-center justify-center rounded-lg px-2 opacity-70 hover:opacity-100">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={onToggleDir} onPointerDown={keepFocus}
        className="flex flex-1 items-center gap-3 py-2 text-left">
        {/* text-white DEĞİL: --paper her iki temada da doğru yönde ters döner. */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-display text-sm font-semibold text-[var(--paper)]"
          aria-hidden>
          {entry.no}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--paper)]/60">
            {DIR_LABEL[entry.dir]}
          </span>
          <span className="block text-base font-medium leading-snug">{entry.clue}</span>
        </span>
      </button>
      <button type="button" onClick={onClearWord} onPointerDown={keepFocus}
        aria-label="Bu kelimeyi temizle (doğrular korunur)" title="Kelimeyi temizle"
        className="flex min-w-11 items-center justify-center rounded-lg px-1.5 opacity-70 hover:opacity-100">
        <Eraser className="h-4 w-4" />
      </button>
      <button type="button" onClick={onNext} onPointerDown={keepFocus} aria-label="Sonraki ipucu"
        className="flex min-w-11 items-center justify-center rounded-lg px-2 opacity-70 hover:opacity-100">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
