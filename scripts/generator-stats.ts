/**
 * Üreteç ölçüm aracı. Veritabanı GEREKTİRMEZ.
 *
 * Ön ayar (GENERATOR_PRESETS) ya da yerleşim algoritması değiştirildiğinde
 * ÖNCE ve SONRA çalıştırılır — kod yorumlarındaki sayılar buradan gelir.
 *
 *   npx tsx scripts/generator-stats.ts [--seeds 300]
 *
 * Ölçülenler:
 *  · üretim başarısı (deneme başına) ve başarısızlık kırılımı
 *  · ÇAPRAZ KONTROL oranı: iki kelimenin birden geçtiği beyaz hücre payı.
 *    Gerçek çengel bulmacada bu oran yüksektir; düşükse oyuncu bir ipucunu
 *    bilemediğinde kelimeyi kesişimlerden TÜRETEMEZ.
 *  · kelime başına kesişim histogramı (1 kesişimli kelime = kör nokta)
 *  · uzunluk dağılımı ve hedef karışımdan (lengthMix) sapma
 *  · ortalama kelime zorluğu (easy < medium < hard olmalı)
 */
import { loadBank } from '@/lib/content';
import {
  GENERATOR_PRESETS, GENERATOR_STATS, generatePuzzle, type GeneratedPuzzle,
} from '@/lib/generator/generator';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

function crossedRatio(p: GeneratedPuzzle): { checked: number; white: number } {
  const owners = new Map<string, number>();
  for (const w of p.words) {
    for (let i = 0; i < w.len; i++) {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      const key = `${r}:${c}`;
      owners.set(key, (owners.get(key) ?? 0) + 1);
    }
  }
  let checked = 0;
  for (const n of owners.values()) if (n >= 2) checked++;
  return { checked, white: owners.size };
}

function crossingsPerWord(p: GeneratedPuzzle): number[] {
  const owners = new Map<string, number>();
  for (const w of p.words) {
    for (let i = 0; i < w.len; i++) {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      owners.set(`${r}:${c}`, (owners.get(`${r}:${c}`) ?? 0) + 1);
    }
  }
  return p.words.map((w) => {
    let n = 0;
    for (let i = 0; i < w.len; i++) {
      const r = w.dir === 'down' ? w.row + i : w.row;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if ((owners.get(`${r}:${c}`) ?? 0) >= 2) n++;
    }
    return n;
  });
}

function main(): void {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i += 2) {
    args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1] ?? '');
  }
  const seeds = Number(args.get('seeds') ?? '300');
  const bank = loadBank();
  const byWord = new Map(bank.map((e) => [e.word, e]));

  for (const difficulty of DIFFICULTIES as readonly Difficulty[]) {
    Object.assign(GENERATOR_STATS, {
      minWords: 0, ratioLow: 0, ratioHigh: 0, invalid: 0, poolEmpty: 0, ok: 0, unchecked: 0,
    });
    const puzzles: GeneratedPuzzle[] = [];
    for (let i = 0; i < seeds; i++) {
      const p = generatePuzzle({ difficulty, bank, seed: 1000 + i * 1009 });
      if (p) puzzles.push(p);
    }
    const preset = GENERATOR_PRESETS[difficulty];
    let checked = 0; let white = 0;
    const hist = new Map<number, number>();
    const lenCount = new Map<number, number>();
    let diffSum = 0; let wordCount = 0; let lenSum = 0;
    const firstRows = new Map<number, number>();
    for (const p of puzzles) {
      const cr = crossedRatio(p);
      checked += cr.checked; white += cr.white;
      for (const n of crossingsPerWord(p)) hist.set(n, (hist.get(n) ?? 0) + 1);
      for (const w of p.words) {
        lenCount.set(w.len, (lenCount.get(w.len) ?? 0) + 1);
        diffSum += byWord.get(w.word)?.difficulty ?? 0;
        lenSum += w.len;
        wordCount++;
      }
      const longest = [...p.words].sort((a, b) => b.len - a.len)[0];
      firstRows.set(longest.row, (firstRows.get(longest.row) ?? 0) + 1);
    }
    const pct = (n: number, d: number): string => (d === 0 ? '—' : `${((n / d) * 100).toFixed(1)}%`);
    const mix = [...lenCount.entries()].sort((a, b) => a[0] - b[0])
      .map(([len, n]) => {
        const target = preset.lengthMix[len] ?? 0;
        return `${len}:${pct(n, wordCount)}(hedef ${(target * 100).toFixed(0)}%)`;
      }).join(' ');

    console.log(`\n=== ${difficulty} (${seeds} tohum) ===`);
    console.log(`  başarı            : ${puzzles.length}/${seeds} (${pct(puzzles.length, seeds)})`);
    console.log(`  başarısızlık      : ${JSON.stringify(GENERATOR_STATS)}`);
    console.log(`  ÇAPRAZ KONTROL    : ${pct(checked, white)} (${checked}/${white} beyaz hücre)`);
    console.log(`  kesişim histogramı: ${[...hist.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}→${v}`).join(' ')}`);
    console.log(`  bulmaca/kelime    : ${(wordCount / Math.max(1, puzzles.length)).toFixed(1)}`);
    console.log(`  ort. uzunluk      : ${(lenSum / Math.max(1, wordCount)).toFixed(2)}`);
    console.log(`  ort. zorluk       : ${(diffSum / Math.max(1, wordCount)).toFixed(2)}`);
    console.log(`  uzunluk karışımı  : ${mix}`);
    console.log(`  en uzun kelimenin satırı: ${[...firstRows.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([r, n]) => `${r}→${n}`).join(' ')}`);
  }
}

main();
