import type { BankEntry } from '@/lib/content';
import type { Difficulty, Direction, Letters } from '@/lib/types';
import { applyPlacement, canPlace, emptyLetters, newCellsOf, numberEntries, type Placement } from './grid';
import { mulberry32, type Rng, shuffle, pick } from './rng';

export type GeneratedWord = {
  no: number; dir: Direction; row: number; col: number; len: number; word: string; clue: string;
};
export type GeneratedPuzzle = {
  size: number; black: boolean[][]; solution: (string | null)[][]; words: GeneratedWord[];
};

export const GENERATOR_PRESETS: Record<
  Difficulty,
  {
    size: number; minWords: number; maxWords: number; allowed: readonly (1 | 2 | 3)[];
    // Kısa "bağlantı" kelimelerinde zorluk katmanı gevşetilir. Türkçede 3-4
    // harfli kelimelerin neredeyse tamamı yaygındır (katman 1); `hard` bunları
    // dışlayınca elinde yalnızca 17 adet 3 harfli kelime kalıyordu ve her zor
    // bulmacada aynı NAL/NİL/KOD/LAV takımı dönüyordu. Gerçek çengel
    // bulmacalarda da zorluk uzun kelimelerden ve ipucunun dilinden gelir,
    // kısa bağlantı kelimelerinden değil.
    shortRelaxMaxLen: number;
    // İskelet fazının kabul ettiği en kısa "omurga" kelime. Eskiden sabit
    // `size-2` idi; zor bulmacada bu yalnızca 8+ harfli kelime demekti ve
    // 6-7 harfliler ızgaraya HİÇ giremiyordu (ölçüm: %0). Zorluğa göre
    // ayarlanınca orta uzunluklar da omurgaya karışıyor.
    skeletonMinLen: number;
    // Hedef uzunluk karışımı (pay). Doldurma fazı buna göre sıralanır; katı
    // kota DEĞİL, yalnızca tercih — yerleşemeyen uzunluk kendiliğinden atlanır.
    lengthMix: Readonly<Record<number, number>>;
  }
> = {
  easy: {
    size: 6, minWords: 7, maxWords: 9, allowed: [1, 2], shortRelaxMaxLen: 0, skeletonMinLen: 5,
    lengthMix: { 3: 0.25, 4: 0.25, 5: 0.28, 6: 0.22 },
  },
  // NOT: minWords spec'teki 11-14 / 16-20 aralıklarından bilinçli olarak
  // düşürüldü. Ölçüm (bkz. aşağıdaki FAZ B yorumu): eski ayarla zor bulmacanın
  // %70'i 3 harfliydi ve 5-7 harfliler hiç kullanılmıyordu. Kelime SAYISI ile
  // uzunluk ÇEŞİTLİLİĞİ beyaz-hücre tavanı altında doğrudan çatışıyor; ~2
  // kelimeden vazgeçmek 3 harf payını %70'ten %20'ye indiriyor ve üretim
  // başarısını da yükseltiyor (hard: %13 → %24).
  medium: {
    size: 8, minWords: 10, maxWords: 14, allowed: [1, 2, 3], shortRelaxMaxLen: 0, skeletonMinLen: 6,
    lengthMix: { 3: 0.18, 4: 0.2, 5: 0.22, 6: 0.18, 7: 0.12, 8: 0.1 },
  },
  hard: {
    size: 10, minWords: 14, maxWords: 20, allowed: [2, 3], shortRelaxMaxLen: 4, skeletonMinLen: 6,
    lengthMix: { 3: 0.15, 4: 0.18, 5: 0.19, 6: 0.16, 7: 0.13, 8: 0.09, 9: 0.05, 10: 0.05 },
  },
};

/** Kelime bu zorluğun havuzuna girer mi (katman + uzunluk + kısa-kelime gevşemesi). */
export function isEligible(
  entry: { word: string; difficulty: 1 | 2 | 3 },
  preset: (typeof GENERATOR_PRESETS)[Difficulty],
): boolean {
  if (entry.word.length > preset.size) return false;
  if (preset.allowed.includes(entry.difficulty)) return true;
  return entry.word.length <= preset.shortRelaxMaxLen;
}

// Üretim ayarı için başarısızlık sayaçları (yalnızca script/test aracı; oyun
// çalışma zamanında kullanılmaz). Ön ayarları elde tutmadan ayarlayabilmek için.
export const GENERATOR_STATS = { minWords: 0, ratioLow: 0, ratioHigh: 0, invalid: 0, poolEmpty: 0, ok: 0 };

export const WHITE_RATIO_MIN = 0.55;
export const WHITE_RATIO_MAX = 0.8;

type Candidate = { entry: BankEntry; placement: Placement; crossings: number };

// Bir kelimenin harfleri, aynı hücrede aynı yönde daha önce yerleşmiş başka bir
// kelimenin ÖN EKİ olabilir (örn. "ÇAM" / "ÇAMUR") — canPlace bunu geçerli bir
// "kesişim" sanır (her harf zaten grid'de var), ama sonuçta iki farklı entry
// tam olarak aynı (row,col,dir) üzerinde başlar. hashKey(no,dir) bu ikisini
// AYNI anahtara düşürdüğü için istemci ikisini asla birlikte doğrulayamaz ve
// oyun hiçbir zaman bitmez (gerçek bir üretim canlı hatası — bkz. Task 18
// sonrası kullanıcı raporu). Bu yüzden aynı başlangıç hücresi+yön ikinci kez
// kabul edilmez.
const startKey = (p: Placement): string => `${p.row}:${p.col}:${p.dir}`;

// tek bir kelimenin ızgaradaki en iyi (en çok kesişimli) yerleşimini bulur.
// not: TS'in kontrol akışı analizi çok derin iç içe döngülerde `best`
// değişkeninin tipini yanlışlıkla `never`e daraltıyor (bkz. strict tsc hatası);
// bu yardımcı fonksiyon aynı mantığı, aynı sonucu üreterek ayırır.
function bestPlacementForEntry(
  entry: BankEntry, letters: Letters, size: number, usedStarts: Set<string>,
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
          if (usedStarts.has(startKey(placement))) continue;
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
  entry: BankEntry, letters: Letters, size: number, rng: Rng, usedStarts: Set<string>,
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
          if (usedStarts.has(startKey(placement))) continue;
          if (canPlace(letters, size, placement) > 0) return placement;
        }
      }
    }
  }
  return null;
}

export function generatePuzzle(opts: {
  difficulty: Difficulty; bank: BankEntry[]; seed: number; exclude?: Set<string>;
  // Bir kelimenin daha önce KAÇ kez kullanıldığı. Verilirse ipucu varyantı
  // rastgele değil sırayla seçilir: aynı kelime tekrar çıktığında oyuncu
  // farklı bir ipucu görür. Verilmezse (test/tek seferlik üretim) rastgele.
  clueIndexFor?: (word: string) => number;
}): GeneratedPuzzle | null {
  const preset = GENERATOR_PRESETS[opts.difficulty];
  const { size } = preset;
  const rng = mulberry32(opts.seed);
  const pool = shuffle(
    rng,
    opts.bank.filter((e) => isEligible(e, preset) && !(opts.exclude?.has(e.word) ?? false)),
  );
  if (pool.length === 0) { GENERATOR_STATS.poolEmpty++; return null; }

  const letters: Letters = emptyLetters(size);
  const placed: { entry: BankEntry; placement: Placement }[] = [];
  const used = new Set<string>();
  const usedStarts = new Set<string>(); // aynı (row,col,dir) ikinci kez kullanılmasın

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
  usedStarts.add(startKey(firstPlacement));

  // FAZ A — iskelet: sadece bir kaç uzun kelimeyi (len >= size-2) en-çok-kesişimli
  // (greedy) seçimle yerleştir. Amaç yayılmış birkaç "omurga" kelimesi bırakmak;
  // hedef kelime SAYISINI kısa kelimelerle FAZ B doldurduğu için burada uzun
  // kelimeye aşırı yatırım yapmıyoruz (yoksa hücre bütçesi/oranı erken tükenir
  // ve kısa kelimelere yer kalmaz — bkz. task-9-report.md ölçüm verisi).
  const skeletonMinLen = preset.skeletonMinLen;
  const skeletonTarget = Math.max(2, Math.ceil(preset.minWords * 0.2));
  while (placed.length < skeletonTarget) {
    let best: Candidate | null = null;
    for (const entry of pool) {
      if (used.has(entry.word) || entry.word.length < skeletonMinLen) continue;
      const candidate = bestPlacementForEntry(entry, letters, size, usedStarts);
      if (candidate !== null && (best === null || candidate.crossings > best.crossings)) {
        best = { entry, placement: candidate.placement, crossings: candidate.crossings };
      }
    }
    if (best === null) break;
    applyPlacement(letters, best.placement);
    placed.push({ entry: best.entry, placement: best.placement });
    used.add(best.entry.word);
    usedStarts.add(startKey(best.placement));
  }

  // FAZ B — doldurma: kalan kelimeler arasından, hedef uzunluk karışımında EN
  // GERİDE kalan uzunluğu tercih ederek rastgele sırayla ilk geçerli yerleşimi
  // kabul et (global en-iyiyi aramadan).
  //
  // Eskiden sıralama katı biçimde "en kısa önce" idi: kısa kelimeler her yere
  // sığdığı için hep onlar kazanıyordu ve ölçüm şuydu — zor bulmacada
  // yerleşimlerin %57'si 3 harfliydi (havuzun %2.9'u), 5-7 harfliler ise
  // neredeyse hiç kullanılmıyordu. Sonuç: her zor bulmacada aynı avuç dolusu
  // kısa kelime dönüyordu. Şimdi sıralama açığa (hedef pay − mevcut pay) göre
  // yapılıyor; bu KATI bir kota değil, yalnızca tercih sırası — yerleşemeyen
  // uzunluk atlanır, üretim başarısı korunur.
  const countByLen = new Map<number, number>();
  for (const p of placed) {
    countByLen.set(p.entry.word.length, (countByLen.get(p.entry.word.length) ?? 0) + 1);
  }
  const maxWhite = Math.floor(size * size * WHITE_RATIO_MAX);
  let whiteCount = letters.flat().filter((c) => c !== null).length;
  let progressed = true;
  while (progressed && placed.length < preset.maxWords) {
    progressed = false;
    const total = Math.max(1, placed.length);
    const deficit = (len: number): number =>
      (preset.lengthMix[len] ?? 0) - (countByLen.get(len) ?? 0) / total;
    const remaining = shuffle(rng, pool.filter((e) => !used.has(e.word)))
      .sort((a, b) => deficit(b.word.length) - deficit(a.word.length));
    for (const entry of remaining) {
      if (placed.length >= preset.maxWords) break;
      const placement = firstPlacementForEntry(entry, letters, size, rng, usedStarts);
      if (placement === null) continue;
      // Beyaz hücre bütçesini ÖNCEDEN kontrol et. Eskiden yerleşimler bütçeye
      // bakılmadan kabul ediliyor, oran tavanı aşılınca da bulmacanın TAMAMI
      // çöpe atılıyordu (üretim boşa gidiyordu). Uzun kelimeler daha çok hücre
      // tükettiğinden, dengeli uzunluk karışımı ancak bu kontrolle mümkün.
      if (whiteCount + newCellsOf(letters, placement) > maxWhite) continue;
      whiteCount += newCellsOf(letters, placement);
      applyPlacement(letters, placement);
      placed.push({ entry, placement });
      used.add(entry.word);
      usedStarts.add(startKey(placement));
      countByLen.set(entry.word.length, (countByLen.get(entry.word.length) ?? 0) + 1);
      progressed = true;
    }
  }

  const white = letters.flat().filter((c) => c !== null).length;
  const ratio = white / (size * size);
  if (placed.length < preset.minWords) { GENERATOR_STATS.minWords++; return null; }
  if (ratio < WHITE_RATIO_MIN) { GENERATOR_STATS.ratioLow++; return null; }
  if (ratio > WHITE_RATIO_MAX) { GENERATOR_STATS.ratioHigh++; return null; }

  const numbered = numberEntries(placed.map((p) => p.placement));
  const clueByWord = new Map(placed.map((p) => {
    const clues = p.entry.clues;
    const idx = opts.clueIndexFor?.(p.entry.word);
    return [p.entry.word, idx === undefined ? pick(rng, clues) : clues[idx % clues.length]] as const;
  }));
  const words: GeneratedWord[] = numbered.map((n) => ({
    ...n, clue: clueByWord.get(n.word) ?? '',
  }));
  const black = letters.map((row) => row.map((c) => c === null));
  const puzzle: GeneratedPuzzle = { size, black, solution: letters, words };
  if (validateGenerated(puzzle).length > 0) { GENERATOR_STATS.invalid++; return null; }
  GENERATOR_STATS.ok++;
  return puzzle;
}

export function generateWithRetries(opts: {
  difficulty: Difficulty; bank: BankEntry[]; seed: number;
  exclude?: Set<string>; maxAttempts?: number;
  clueIndexFor?: (word: string) => number;
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

  // 1b) iki farklı entry aynı (row,col,dir) üzerinde başlayamaz — biri diğerinin
  // ön eki olduğunda (ör. "ÇAM"/"ÇAMUR") canPlace bunu geçerli kesişim sanabilir,
  // ama hashKey(no,dir) ikisini aynı anahtara düşürür ve istemci ikisini birden
  // asla doğrulayamaz (oyun hiç bitmeyen bir çıkmaza girer).
  const startSeen = new Set<string>();
  for (const w of words) {
    const key = `${w.row}:${w.col}:${w.dir}`;
    if (startSeen.has(key)) errors.push(`aynı başlangıçta çakışan entry: ${key} (${w.word})`);
    startSeen.add(key);
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
