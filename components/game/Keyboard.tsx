'use client';

import { Delete } from 'lucide-react';

const ROWS: string[][] = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'],
];

const KEY_CLASS =
  'h-12 rounded-lg border border-[var(--line)] bg-[var(--paper-raised)] font-semibold text-[var(--ink)] ' +
  'shadow-[0_2px_0_var(--line)] transition-all duration-75 ' +
  'active:translate-y-[2px] active:bg-[var(--cell-active)] active:shadow-none';

export function Keyboard({ onLetter, onDelete }: {
  onLetter: (letter: string) => void; onDelete: () => void;
}) {
  return (
    <div className="select-none rounded-xl border-t border-[var(--line)] bg-[var(--paper)] px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
      <div className="space-y-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((letter) => (
              <button key={letter} type="button"
                onPointerDown={(e) => { e.preventDefault(); onLetter(letter); }}
                className={`min-w-0 flex-1 max-w-[2.6rem] ${KEY_CLASS}`}
                aria-label={letter}>
                {letter}
              </button>
            ))}
            {i === 2 && (
              <button type="button" onPointerDown={(e) => { e.preventDefault(); onDelete(); }}
                className={`flex flex-1 max-w-[3.6rem] items-center justify-center ${KEY_CLASS}`}
                aria-label="Sil">
                <Delete className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
