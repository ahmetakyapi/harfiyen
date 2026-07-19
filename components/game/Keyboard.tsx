'use client';

import { Delete } from 'lucide-react';

const ROWS: string[][] = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'],
];

export function Keyboard({ onLetter, onDelete }: {
  onLetter: (letter: string) => void; onDelete: () => void;
}) {
  return (
    <div className="select-none space-y-1.5 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {row.map((letter) => (
            <button key={letter} type="button"
              onPointerDown={(e) => { e.preventDefault(); onLetter(letter); }}
              className="h-12 min-w-0 flex-1 max-w-[2.6rem] rounded-md bg-[var(--paper-raised)] font-medium shadow-sm active:bg-[var(--cell-active)]"
              aria-label={letter}>
              {letter}
            </button>
          ))}
          {i === 2 && (
            <button type="button" onPointerDown={(e) => { e.preventDefault(); onDelete(); }}
              className="flex h-12 flex-1 max-w-[3.6rem] items-center justify-center rounded-md bg-[var(--paper-raised)] shadow-sm active:bg-[var(--cell-active)]"
              aria-label="Sil">
              <Delete className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
