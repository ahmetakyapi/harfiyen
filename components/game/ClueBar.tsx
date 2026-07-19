'use client';

import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import type { Entry } from '@/lib/types';

const DIR_LABEL = { across: 'Soldan sağa', down: 'Yukarıdan aşağıya' } as const;

export function ClueBar({ entry, onPrev, onNext, onToggleDir, onClearWord }: {
  entry: Entry; onPrev: () => void; onNext: () => void; onToggleDir: () => void; onClearWord: () => void;
}) {
  return (
    <div className="flex min-h-14 items-stretch gap-1 rounded-xl bg-[var(--ink)] pl-1 pr-1 text-[var(--paper)] shadow-sm">
      <button type="button" onClick={onPrev} aria-label="Önceki ipucu"
        className="flex min-w-11 items-center justify-center rounded-lg px-2 opacity-70 hover:opacity-100">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={onToggleDir} className="flex flex-1 items-center gap-3 py-2 text-left">
        {/* text-white DEĞİL: dark modda --accent açık turuncu olduğundan beyaz metin
            WCAG AA'yı geçemez (~2.8:1). --paper her iki temada da doğru yönde ters döner. */}
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
      <button type="button" onClick={onClearWord} aria-label="Bu kelimeyi temizle (doğrular korunur)"
        title="Kelimeyi temizle"
        className="flex min-w-11 items-center justify-center rounded-lg px-1.5 opacity-70 hover:opacity-100">
        <Eraser className="h-4 w-4" />
      </button>
      <button type="button" onClick={onNext} aria-label="Sonraki ipucu"
        className="flex min-w-11 items-center justify-center rounded-lg px-2 opacity-70 hover:opacity-100">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
