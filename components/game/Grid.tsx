'use client';

import { motion } from 'framer-motion';
import { cellsOf } from '@/hooks/useGameState';
import type { ClientPuzzle, Letters } from '@/lib/types';
import type { Selection } from '@/hooks/useGameState';

export const GRID_PAD = 3;
export const GRID_GAP = 2;

/** Kenar boşlukları/aralıklar çıkarıldıktan sonra tek bir hücrenin px kenarı. */
export function cellSizeOf(gridPx: number, size: number): number {
  return (gridPx - 2 * GRID_PAD - (size - 1) * GRID_GAP) / size;
}

// Hücreler GERÇEK butonlardır: dokunma doğrudan hücreye gider (piksel
// matematiğiyle hücre tahmin etmeye gerek yok) ve ekran okuyucu grid'i
// gezebilir. Native klavye açılmadığından (girdi kendi ekran klavyemizden
// gelir) butona dokunmak viewport'u zıplatmaz.
//
// Harf/numara boyutu `em` ile verilir; grid'in font-size'ı hücre kenarına
// eşitlendiğinden 6×6 ve 10×10 aynı oranda okunur — eski `4vw` yaklaşımı
// viewport'a bağlıydı ve 10×10'da harfler hücreye sığmıyordu.
export function Grid({
  puzzle, letters, sel, activeCells, correctCells, hintCells, flashCell, cellPx, onSelect,
}: {
  puzzle: ClientPuzzle; letters: Letters; sel: Selection;
  activeCells: Set<string>;   // `${row}:${col}` — aktif kelimenin hücreleri
  correctCells: Set<string>;  // doğrulanmış kelimelerin hücreleri
  hintCells: Set<string>;     // ipucuyla açılan hücreler — köşe işareti + kilitli
  flashCell?: string | null;  // ipucuyla az önce açılan hücre — kısa parıltı
  cellPx: number | null;      // ölçülen hücre kenarı; null → oransal yedek
  onSelect: (row: number, col: number) => void;
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
    <div role="grid" aria-label={`${puzzle.size}×${puzzle.size} bulmaca`}
      className="grid h-full w-full touch-manipulation select-none rounded-2xl border border-[var(--line)] bg-[var(--line)] shadow-[0_24px_60px_-42px_var(--ink)]"
      style={{
        gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
        gap: GRID_GAP, padding: GRID_PAD,
        // Hücre kenarı = 1em. Ölçüm gelmeden önce (ilk render) kabaca
        // viewport'tan türet, böylece harfler bir kare boyunca zıplamaz.
        fontSize: cellPx !== null ? `${cellPx}px` : `min(${90 / puzzle.size}vw, 2.6rem)`,
      }}>
      {puzzle.black.map((rowArr, r) => (
        // display:contents — satır semantiğini verir ama CSS grid akışını bozmaz.
        <div key={r} role="row" className="contents">
          {rowArr.map((isBlack, c) => {
            const key = `${r}:${c}`;
            if (isBlack) {
              return <div key={key} role="gridcell" aria-hidden className="cell-void rounded-[3px]" />;
            }
            const isSel = sel.row === r && sel.col === c;
            const isCorrect = correctCells.has(key);
            const letter = letters[r][c];
            // NOT: isCorrect burada base rengi belirlemez — hücre normal rengini korur,
            // --correct-soft'a geçişi SADECE aşağıdaki stagger'lı motion.span overlay taşır.
            // Aksi halde base className aynı anda --correct-soft'a atlar ve dalga görünmez olur.
            const bg = isSel ? 'bg-[var(--cell-active)]'
              : activeCells.has(key) ? 'bg-[var(--cell-word)]'
              : 'bg-[var(--cell)]';
            // Seçim yalnızca renkle değil, kalın bir halka + hafif büyütmeyle de
            // işaretlenir — renk körlüğünde veya düşük kontrastlı ekranlarda bile
            // "hangi hücredeyim" tek bakışta net olsun.
            const ring = isSel
              ? 'z-20 scale-[1.08] ring-[3px] ring-inset ring-[var(--accent)] shadow-lg'
              : '';
            return (
              <button key={key} type="button" role="gridcell" data-sel={isSel || undefined}
                onPointerDown={(e) => {
                  // pointerdown: dokunuşa anında tepki + varsayılan metin
                  // seçimi/vurgulama engellenir. click beklenirse ~100 ms
                  // gecikme hissedilir.
                  e.preventDefault();
                  onSelect(r, c);
                }}
                onClick={(e) => e.preventDefault()}
                tabIndex={isSel ? 0 : -1}
                aria-label={
                  `${r + 1}. satır ${c + 1}. sütun` +
                  (numberAt.has(key) ? `, ${numberAt.get(key)} numaralı kelimenin başı` : '') +
                  `, ${letter ?? 'boş'}` +
                  (isCorrect ? ', doğru' : '') +
                  (hintCells.has(key) ? ', ipucuyla açıldı' : '')
                }
                className={`relative aspect-square rounded-[3px] ${bg} ${ring} transition-[background-color,transform] duration-100`}>
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
                {hintCells.has(key) && (
                  // İpucuyla açılmış harfin kalıcı işareti: sağ üst köşede amber
                  // üçgen (gazete bulmacası uygulamalarının "açıldı" dili). Hücre
                  // sonradan yeşile dönse bile işaret kalır — kim bakarsa baksın
                  // bu harfin ipucuyla geldiği belli olur.
                  <span aria-hidden
                    className="pointer-events-none absolute right-0 top-0 z-10 rounded-tr-[3px] border-l-transparent border-t-[#d97706]"
                    style={{ borderLeftWidth: '0.3em', borderTopWidth: '0.3em' }} />
                )}
                {numberAt.has(key) && (
                  <span aria-hidden
                    className="pointer-events-none absolute left-[0.09em] top-[0.02em] z-10 font-bold leading-tight text-[var(--ink)]"
                    style={{ fontSize: '0.28em' }}>
                    {numberAt.get(key)}
                  </span>
                )}
                {letter && (
                  <motion.span
                    key={letter}
                    aria-hidden
                    initial={{ scale: 0.7, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 flex h-full w-full items-center justify-center font-semibold leading-none"
                    style={{ fontSize: '0.58em' }}>
                    {letter}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
