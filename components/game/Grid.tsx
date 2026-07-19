'use client';

import { motion } from 'framer-motion';
import { cellsOf } from '@/hooks/useGameState';
import type { ClientPuzzle, Letters } from '@/lib/types';
import type { Selection } from '@/hooks/useGameState';

export function Grid({ puzzle, letters, sel, activeCells, correctCells, flashCell, onCellTap }: {
  puzzle: ClientPuzzle; letters: Letters; sel: Selection;
  activeCells: Set<string>;   // `${row}:${col}` — aktif kelimenin hücreleri
  correctCells: Set<string>;  // doğrulanmış kelimelerin hücreleri
  flashCell?: string | null;  // ipucuyla az önce açılan hücre — kısa vermilyon parıltı
  onCellTap: (row: number, col: number) => void;
}) {
  const numberAt = new Map<string, number>();
  for (const e of puzzle.entries) {
    const key = `${e.row}:${e.col}`;
    if (!numberAt.has(key)) numberAt.set(key, e.no);
  }
  // kelime tamamlanınca soldan sağa / yukarıdan aşağıya 30ms stagger'lı dalga için
  // her hücrenin ait olduğu (tamamlanmış) kelime içindeki sırasını hesapla
  const waveIndex = new Map<string, number>();
  for (const e of puzzle.entries) {
    const cells = cellsOf(e);
    const complete = cells.every((c) => correctCells.has(`${c.row}:${c.col}`));
    if (!complete) continue;
    cells.forEach((c, i) => {
      const key = `${c.row}:${c.col}`;
      if (!waveIndex.has(key)) waveIndex.set(key, i);
    });
  }
  return (
    <div role="grid" aria-label="Bulmaca"
      className="mx-auto grid w-full max-w-[28rem] gap-[2px] rounded-lg border border-[var(--line)] bg-[var(--line)] p-[2px]"
      style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>
      {puzzle.black.map((rowArr, r) =>
        rowArr.map((isBlack, c) => {
          const key = `${r}:${c}`;
          if (isBlack) return <div key={key} className="aspect-square rounded-[3px] bg-[var(--ink)]" />;
          const isSel = sel.row === r && sel.col === c;
          const isCorrect = correctCells.has(key);
          const bg = isSel ? 'bg-[var(--cell-active)]'
            : activeCells.has(key) ? 'bg-[var(--cell-word)]'
            : isCorrect ? 'bg-[var(--correct-soft)]'
            : 'bg-[var(--cell)]';
          return (
            <button key={key} type="button" role="gridcell"
              onPointerDown={(e) => { e.preventDefault(); onCellTap(r, c); }}
              className={`relative aspect-square rounded-[3px] ${bg} outline-none transition-colors duration-100`}
              aria-label={`Satır ${r + 1}, sütun ${c + 1}`}>
              {isCorrect && (
                <motion.span
                  key={`wave-${key}`}
                  className="pointer-events-none absolute inset-0 z-0 rounded-[3px] bg-[var(--correct-soft)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: (waveIndex.get(key) ?? 0) * 0.03 }}
                />
              )}
              {flashCell === key && (
                <motion.span
                  key={`flash-${key}`}
                  className="pointer-events-none absolute inset-0 z-0 rounded-[3px] bg-[var(--accent)]"
                  initial={{ opacity: 0.55 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              {numberAt.has(key) && (
                <span className="pointer-events-none absolute left-0.5 top-0 z-10 text-[0.5rem] leading-tight text-[var(--ink-soft)]">
                  {numberAt.get(key)}
                </span>
              )}
              {letters[r][c] && (
                <motion.span
                  key={letters[r][c]}
                  initial={{ scale: 0.7, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 flex h-full w-full items-center justify-center text-[clamp(0.9rem,4vw,1.35rem)] font-semibold">
                  {letters[r][c]}
                </motion.span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
