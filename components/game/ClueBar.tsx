'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Entry } from '@/lib/types';

const DIR_LABEL = { across: 'Soldan sağa', down: 'Yukarıdan aşağıya' } as const;

export function ClueBar({ entry, onPrev, onNext, onToggleDir }: {
  entry: Entry; onPrev: () => void; onNext: () => void; onToggleDir: () => void;
}) {
  return (
    <div className="flex items-stretch gap-1 rounded-lg bg-[var(--cell-word)] px-1 py-1.5">
      <button type="button" onClick={onPrev} aria-label="Önceki ipucu" className="px-2">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={onToggleDir} className="flex-1 text-left">
        <span className="mr-2 text-xs font-semibold text-[var(--accent)]">
          {entry.no} {DIR_LABEL[entry.dir]}
        </span>
        <span className="text-sm">{entry.clue}</span>
      </button>
      <button type="button" onClick={onNext} aria-label="Sonraki ipucu" className="px-2">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
