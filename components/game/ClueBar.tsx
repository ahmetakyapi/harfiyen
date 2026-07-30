'use client';

import { Check, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import type { Entry } from '@/lib/types';

const DIR_LABEL = { across: 'Soldan sağa', down: 'Yukarıdan aşağıya' } as const;

const ARROW_BTN =
  'flex min-w-11 items-center justify-center rounded-lg px-2 opacity-70 transition-opacity hover:opacity-100';

export function ClueBar({ entry, solved, onPrev, onNext, onToggleDir, onClearWord }: {
  entry: Entry; solved: boolean;
  onPrev: () => void; onNext: () => void; onToggleDir: () => void; onClearWord: () => void;
}) {
  return (
    <div className="flex min-h-[3.25rem] shrink-0 items-stretch gap-1 rounded-2xl bg-[var(--ink)] px-1 text-[var(--paper)] shadow-[0_10px_28px_-20px_var(--ink)]">
      <button type="button" onClick={onPrev} aria-label="Önceki ipucu" className={ARROW_BTN}>
        <ChevronLeft aria-hidden className="h-5 w-5" />
      </button>
      <button type="button" onClick={onToggleDir}
        aria-label={`${entry.clue} — yönü değiştir`}
        className="flex flex-1 items-center gap-2.5 py-1.5 text-left">
        {/* text-white DEĞİL: --paper her iki temada da doğru yönde ters döner. */}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-[var(--paper)] ${
            solved ? 'bg-[var(--correct)]' : 'bg-[var(--accent)]'
          }`}
          aria-hidden>
          {solved ? <Check className="h-4 w-4" strokeWidth={3} /> : entry.no}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--paper)]/60">
            {DIR_LABEL[entry.dir]} · {entry.len} harf
          </span>
          {/* İpuçları uzun olabiliyor; iki satıra izin verilir, fazlası kırpılır
              (tam metin her zaman ipucu listesinde görünür). `block` KOYMA:
              line-clamp `display:-webkit-box` gerektirir, `block` onu ezip
              kırpmayı devre dışı bırakıyor ve şerit 4-5 satıra uzayıp grid'in
              yerini yiyordu — dar ekranda hücreler 20 px'e düşüyordu. */}
          <span className="line-clamp-2 text-[0.9375rem] font-medium leading-snug sm:text-base">
            {entry.clue}
          </span>
        </span>
      </button>
      <button type="button" onClick={onClearWord}
        aria-label="Bu kelimeyi temizle (doğrular korunur)" title="Kelimeyi temizle"
        className={`${ARROW_BTN} min-w-10`}>
        <Eraser aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" onClick={onNext} aria-label="Sonraki ipucu" className={ARROW_BTN}>
        <ChevronRight aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
}
