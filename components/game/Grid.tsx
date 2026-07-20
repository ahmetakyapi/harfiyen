'use client';

import { motion } from 'framer-motion';
import { cellsOf } from '@/hooks/useGameState';
import type { ClientPuzzle, Letters } from '@/lib/types';
import type { Selection } from '@/hooks/useGameState';

// Grid yalnızca GÖRSEL: dokunma/tıklama GameBoard'daki tam-kaplayan input
// tarafından ele alınır (mobilde native klavyeyi ilk dokunuşta açmak için).
// Bu yüzden hücreler pointer-events-none div'lerdir, buton değil.
export function Grid({ puzzle, letters, sel, activeCells, correctCells, hintCells, flashCell }: {
  puzzle: ClientPuzzle; letters: Letters; sel: Selection;
  activeCells: Set<string>;   // `${row}:${col}` — aktif kelimenin hücreleri
  correctCells: Set<string>;  // doğrulanmış kelimelerin hücreleri
  hintCells: Set<string>;     // ipucuyla açılan hücreler — köşe işareti + kilitli
  flashCell?: string | null;  // ipucuyla az önce açılan hücre — kısa parıltı
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
    // pointer-events-none ŞART: seçili hücre z-20 + scale ile input'un (z-10)
    // ÜSTÜNE çıkıyordu; dokunuşları yutup native klavyenin açılmasını
    // engelliyordu ("bazen açılmıyor" sorunu buydu). none olunca tüm
    // dokunuşlar alttaki input'a geçer, klavye her dokunuşta açılır.
    <div role="grid" aria-label="Bulmaca" aria-hidden
      className="pointer-events-none grid w-full gap-[2px] rounded-2xl border border-[var(--line)] bg-[var(--line)] p-[3px] shadow-[0_24px_60px_-42px_var(--ink)]"
      style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))` }}>
      {puzzle.black.map((rowArr, r) =>
        rowArr.map((isBlack, c) => {
          const key = `${r}:${c}`;
          if (isBlack) return <div key={key} className="cell-void aspect-square rounded-[3px]" />;
          const isSel = sel.row === r && sel.col === c;
          const isCorrect = correctCells.has(key);
          // NOT: isCorrect burada base rengi belirlemez — hücre normal rengini korur,
          // --correct-soft'a geçişi SADECE aşağıdaki stagger'lı motion.span overlay taşır.
          // Aksi halde base className aynı anda --correct-soft'a atlar ve dalga görünmez olur.
          const bg = isSel ? 'bg-[var(--cell-active)]'
            : activeCells.has(key) ? 'bg-[var(--cell-word)]'
            : 'bg-[var(--cell)]';
          // Seçim yalnızca renkle değil, kalın bir halka + hafif büyütmeyle de
          // işaretlenir — renk körlüğünde veya düşük kontrastlı ekranlarda bile
          // "hangi hücredeyim" tek bakışta net olsun.
          // Seçili hücre: kalın accent halka + belirgin büyütme + gölge, açık
          // ara boşlukla iyice "yükselir". Aktif kelime ise belirgin --cell-word
          // rengiyle gruplanır (renk tek başına yeterince net).
          const ring = isSel ? 'z-20 scale-[1.1] ring-[3px] ring-inset ring-[var(--accent)] shadow-lg' : '';
          return (
            <div key={key} role="gridcell" data-sel={isSel || undefined}
              // scroll-mt: scrollIntoView, yapışkan header+ipucu şeridinin
              // altına gizlemesin diye üstte boşluk bırakır.
              className={`relative aspect-square scroll-mt-36 rounded-[3px] ${bg} ${ring} transition-all duration-100`}>
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
                  className="pointer-events-none absolute right-0 top-0 z-10 h-0 w-0 rounded-tr-[3px] border-l-[10px] border-t-[10px] border-l-transparent border-t-[#d97706]" />
              )}
              {numberAt.has(key) && (
                <span className="pointer-events-none absolute left-1 top-0.5 z-10 text-[0.7rem] font-bold leading-tight text-[var(--ink)]">
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
            </div>
          );
        }),
      )}
    </div>
  );
}
