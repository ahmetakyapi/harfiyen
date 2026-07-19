'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Entry } from '@/lib/types';

const DIR_LABEL = { across: 'Soldan sağa', down: 'Yukarıdan aşağıya' } as const;

export function ClueBar({ entry, onPrev, onNext, onToggleDir }: {
  entry: Entry; onPrev: () => void; onNext: () => void; onToggleDir: () => void;
}) {
  return (
    <div className="flex min-h-11 items-stretch gap-1 rounded-lg bg-[var(--cell-word)] px-1">
      <button type="button" onClick={onPrev} aria-label="Önceki ipucu" className="flex min-w-11 items-center justify-center px-2">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={onToggleDir} className="flex flex-1 flex-col justify-center text-left">
        <span className="mr-2 text-xs font-semibold text-[var(--accent)]">
          {entry.no} {DIR_LABEL[entry.dir]}
        </span>
        <span className="text-sm">{entry.clue}</span>
      </button>
      <button type="button" onClick={onNext} aria-label="Sonraki ipucu" className="flex min-w-11 items-center justify-center px-2">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
