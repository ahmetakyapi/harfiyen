import type { BankEntry } from '@/lib/content';
import type { Difficulty, Direction, Letters } from '@/lib/types';
import { applyPlacement, canPlace, emptyLetters, numberEntries, type Placement } from './grid';
import { mulberry32, type Rng, shuffle, pick } from './rng';

export type GeneratedWord = {
  no: number; dir: Direction; row: number; col: number; len: number; word: string; clue: string;
};
export type GeneratedPuzzle = {
  size: number; black: boolean[][]; solution: (string | null)[][]; words: GeneratedWord[];
};

export const GENERATOR_PRESETS: Record<
  Difficulty,
  { size: number; minWords: number; maxWords: number; allowed: readonly (1 | 2 | 3)[] }
> = {
  easy: { size: 6, minWords: 7, maxWords: 9, allowed: [1, 2] },
  medium: { size: 8, minWords: 11, maxWords: 14, allowed: [1, 2, 3] },
  hard: { size: 10, minWords: 16, maxWords: 20, allowed: [2, 3] },
};

export const WHITE_RATIO_MIN = 0.55;
export const WHITE_RATIO_MAX = 0.8;

type Candidate = { entry: BankEntry; placement: Placement; crossings: number };

// tek bir kelimenin ızgaradaki en iyi (en çok kesişimli) yerleşimini bulur.
// not: TS'in kontrol akışı analizi çok derin iç içe döngülerde `best`
// değişkeninin tipini yanlışlıkla `never`e daraltıyor (bkz. strict tsc hatası);
// bu yardımcı fonksiyon aynı mantığı, aynı sonucu üreterek ayırır.
function bestPlacementForEntry(
  entry: BankEntry, letters: Letters, size: number,
): { placement: Placement; crossings: number } | null {
  let best: { placement: Placement; crossings: number } | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (letters[r][c] === null) continue;
      for (let i = 0; i < entry.word.length; i++) {
        if (entry.word[i] !== letters[r][c]) continue;
        for (const dir of ['across', 'down'] as const) {
          const placement: Placement = {
            word: entry.word, dir,
            row: dir === 'down' ? r - i : r,
            col: dir === 'across' ? c - i : c,
          };
          const crossings = canPlace(letters, size, placement);
          if (crossings > 0 && (best === null || crossings > best.crossings)) {
            best = { placement, crossings };
          }
        }
      }
    }
  }
  return best;
}

// bir kelime için GEÇERLİ herhangi bir yerleşim bulur (en iyisi değil, ilk uygun olan).
// satır/sütun/tarafgel taraması rastgele sırayla yapılır ki art arda çağrılarda
// hep aynı (ör. sol üst) bölgeye yığılma olmasın — bu, greedy en-çok-kesişim
// seçiminin yerleşimleri tek bir kümede toplayıp geri kalan kelimeler için
// geçerli kesişim noktası bırakmama sorununu (bkz. task-9-report.md) giderir.
function firstPlacementForEntry(
  entry: BankEntry, letters: Letters, size: number, rng: Rng,
): Placement | null {
  const rows = shuffle(rng, Array.from({ length: size }, (_, i) => i));
  const cols = shuffle(rng, Array.from({ length: size }, (_, i) => i));
  const dirs = shuffle(rng, ['across', 'down'] as const);
  for (const r of rows) {
    for (const c of cols) {
      if (letters[r][c] === null) continue;
      for (let i = 0; i < entry.word.length; i++) {
        if (entry.word[i] !== letters[r][c]) continue;
        for (const dir of dirs) {
          const placement: Placement = {
            word: entry.word, dir,
            row: dir === 'down' ? r - i : r,
            col: dir === 'across' ? c - i : c,
          };
          if (canPlace(letters, size, placement) > 0) return placement;
        }
      }
    }
  }
  return null;
}

export function generatePuzzle(opts: {
  difficulty: Difficulty; bank: BankEntry[]; seed: number; exclude?: Set<string>;
}): GeneratedPuzzle | null {
  const preset = GENERATOR_PRESETS[opts.difficulty];
  const { size } = preset;
  const rng = mulberry32(opts.seed);
  const pool = shuffle(
    rng,
    opts.bank.filter(
      (e) =>
        preset.allowed.includes(e.difficulty) &&
        e.word.length <= size &&
        !(opts.exclude?.has(e.word) ?? false),
    ),
  );
  if (pool.length === 0) return null;

  const letters: Letters = emptyLetters(size);
  const placed: { entry: BankEntry; placement: Placement }[] = [];
  const used = new Set<string>();

  // ilk kelime: havuzdaki en uzunlardan biri, merkeze yatay
  const maxLen = Math.max(...pool.map((e) => e.word.length));
  const firstEntry = pool.find((e) => e.word.length === maxLen);
  if (!firstEntry) return null;
  const firstPlacement: Placement = {
    word: firstEntry.word, dir: 'across',
    row: Math.floor(size / 2),
    col: Math.floor((size - firstEntry.word.length) / 2),
  };
  applyPlacement(letters, firstPlacement);
  placed.push({ entry: firstEntry, placement: firstPlacement });
  used.add(firstEntry.word);

  // FAZ A — iskelet: sadece bir kaç uzun kelimeyi (len >= size-2) en-çok-kesişimli
  // (greedy) seçimle yerleştir. Amaç yayılmış birkaç "omurga" kelimesi bırakmak;
  // hedef kelime SAYISINI kısa kelimelerle FAZ B doldurduğu için burada uzun
  // kelimeye aşırı yatırım yapmıyoruz (yoksa hücre bütçesi/oranı erken tükenir
  // ve kısa kelimelere yer kalmaz — bkz. task-9-report.md ölçüm verisi).
  const skeletonMinLen = Math.max(3, size - 2);
  const skeletonTarget = Math.max(2, Math.ceil(preset.minWords * 0.2));
  while (placed.length < skeletonTarget) {
    let best: Candidate | null = null;
    for (const entry of pool) {
      if (used.has(entry.word) || entry.word.length < skeletonMinLen) continue;
      const candidate = bestPlacementForEntry(entry, letters, size);
      if (candidate !== null && (best === null || candidate.crossings > best.crossings)) {
        best = { entry, placement: candidate.placement, crossings: candidate.crossings };
      }
    }
    if (best === null) break;
    applyPlacement(letters, best.placement);
    placed.push({ entry: best.entry, placement: best.placement });
    used.add(best.entry.word);
  }

  // FAZ B — doldurma: kalan kelimeler arasından her turda en KISA olanı tercih
  // ederek rastgele sırayla ilk geçerli yerleşimi kabul et (global en-iyiyi
  // aramadan). Kısa kelimeler daha az hücre tüketir, bu yüzden aynı beyaz-oran
  // bütçesi içinde çok daha fazla kelime sayısına ulaşmayı sağlar; rastgele
  // tur sırası ise yerleşimleri ızgaraya yayarak greedy'nin tıkanma sorununu
  // önlüyor (her tur havuz yeniden karıştırılıyor).
  let progressed = true;
  while (progressed && placed.length < preset.maxWords) {
    progressed = false;
    const remaining = shuffle(rng, pool.filter((e) => !used.has(e.word)))
      .sort((a, b) => a.word.length - b.word.length);
    for (const entry of remaining) {
      if (placed.length >= preset.maxWords) break;
      const placement = firstPlacementForEntry(entry, letters, size, rng);
      if (placement === null) continue;
      applyPlacement(letters, placement);
      placed.push({ entry, placement });
      used.add(entry.word);
      progressed = true;
    }
  }

  const white = letters.flat().filter((c) => c !== null).length;
  const ratio = white / (size * size);
  if (placed.length < preset.minWords) return null;
  if (ratio < WHITE_RATIO_MIN || ratio > WHITE_RATIO_MAX) return null;

  const numbered = numberEntries(placed.map((p) => p.placement));
  const clueByWord = new Map(placed.map((p) => [p.entry.word, pick(rng, p.entry.clues)]));
  const words: GeneratedWord[] = numbered.map((n) => ({
    ...n, clue: clueByWord.get(n.word) ?? '',
  }));
  const black = letters.map((row) => row.map((c) => c === null));
  const puzzle: GeneratedPuzzle = { size, black, solution: letters, words };
  return validateGenerated(puzzle).length === 0 ? puzzle : null;
}

export function generateWithRetries(opts: {
  difficulty: Difficulty; bank: BankEntry[]; seed: number;
  exclude?: Set<string>; maxAttempts?: number;
}): GeneratedPuzzle {
  // Not: varsayılan 40'tan yükseltildi. Doldurma fazının katı komşuluk
  // kurallarıyla (kazara uzama/paralel bitişme yasağı) `hard` ön ayarının
  // hedeflediği yoğunluğa (16-20 kelime) ulaşma olasılığı deneme başına
  // düşük (~%1-2) — bkz. task-9-report.md ölçümleri. Deneme başı maliyet
  // birkaç ms olduğundan yüksek deneme sayısı ucuzdur; asıl garantiyi veren
  // budur (algoritma iyileştirmeleri temel olasılığı yükseltti ama tek
  // başına yetmiyor).
  const attempts = opts.maxAttempts ?? 400;
  for (let i = 0; i < attempts; i++) {
    const p = generatePuzzle({ ...opts, seed: opts.seed + i * 1009 });
    if (p) return p;
  }
  throw new Error(`üretim başarısız: ${opts.difficulty}, seed ${opts.seed} (${attempts} deneme)`);
}

export function validateGenerated(p: GeneratedPuzzle): string[] {
  const errors: string[] = [];
  const { size, solution, words } = p;

  // 1) kelime tekrarı yok, min uzunluk 3
  const seen = new Set<string>();
  for (const w of words) {
    if (w.word.length < 3) errors.push(`kısa kelime: ${w.word}`);
    if (seen.has(w.word)) errors.push(`tekrar: ${w.word}`);
    seen.add(w.word);
  }

  // 2) her maksimal ≥2 dizi yerleştirilmiş bir kelimeye karşılık gelir
  const wordAt = new Set(words.map((w) => `${w.row}:${w.col}:${w.dir}:${w.len}`));
  for (const dir of ['across', 'down'] as const) {
    for (let a = 0; a < size; a++) {
      let run = 0; let startR = 0; let startC = 0;
      for (let b = 0; b <= size; b++) {
        const r = dir === 'across' ? a : b;
        const c = dir === 'across' ? b : a;
        const letter = b < size ? solution[r][c] : null;
        if (letter !== null) {
          if (run === 0) { startR = r; startC = c; }
          run++;
        } else {
          if (run >= 2 && !wordAt.has(`${startR}:${startC}:${dir}:${run}`)) {
            errors.push(`kazara dizi: ${dir} ${startR},${startC} len ${run}`);
          }
          run = 0;
        }
      }
    }
  }

  // 3) bağlantılılık (BFS)
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (solution[r][c] !== null) cells.push([r, c]);
  if (cells.length > 0) {
    const key = (r: number, c: number): string => `${r}:${c}`;
    const all = new Set(cells.map(([r, c]) => key(r, c)));
    const queue = [cells[0]];
    const visited = new Set([key(...cells[0])]);
    while (queue.length > 0) {
      const [r, c] = queue.pop() as [number, number];
      for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as const) {
        const k = key(nr, nc);
        if (all.has(k) && !visited.has(k)) { visited.add(k); queue.push([nr, nc]); }
      }
    }
    if (visited.size !== all.size) errors.push('grid bağlantılı değil');
  }

  return errors;
}
