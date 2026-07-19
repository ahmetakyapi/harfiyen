import { describe, expect, it } from 'vitest';
import { loadBank } from '@/lib/content';
import { DIFFICULTIES } from '@/lib/types';
import {
  GENERATOR_PRESETS, WHITE_RATIO_MAX, WHITE_RATIO_MIN,
  generateWithRetries, validateGenerated,
} from './generator';

const bank = loadBank();

describe('generateWithRetries (property, seed 1-5, her zorluk)', () => {
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 1; seed <= 5; seed++) {
      it(`${difficulty} seed=${seed}: geçerli bulmaca üretir`, () => {
        const p = generateWithRetries({ difficulty, bank, seed });
        const preset = GENERATOR_PRESETS[difficulty];
        expect(validateGenerated(p)).toEqual([]);
        expect(p.size).toBe(preset.size);
        expect(p.words.length).toBeGreaterThanOrEqual(preset.minWords);
        expect(p.words.length).toBeLessThanOrEqual(preset.maxWords);
        const white = p.solution.flat().filter((c) => c !== null).length;
        const ratio = white / (p.size * p.size);
        expect(ratio).toBeGreaterThanOrEqual(WHITE_RATIO_MIN);
        expect(ratio).toBeLessThanOrEqual(WHITE_RATIO_MAX);
        // tüm kelimeler bankadan ve zorluk filtresine uygun
        const allowed = new Set(
          bank.filter((e) => preset.allowed.includes(e.difficulty)).map((e) => e.word),
        );
        for (const w of p.words) expect(allowed.has(w.word)).toBe(true);
        // hiçbir iki entry aynı (row,col,dir) üzerinde başlamaz (bkz. "ÇAM"/"ÇAMUR"
        // canlı hatası — biri diğerinin ön eki olduğunda hashKey(no,dir) çakışır
        // ve istemci ikisini asla birlikte doğrulayamaz, oyun hiç bitmez)
        const starts = p.words.map((w) => `${w.row}:${w.col}:${w.dir}`);
        expect(new Set(starts).size).toBe(starts.length);
      });
    }
  }

  it('aynı seed deterministik sonuç üretir', () => {
    const a = generateWithRetries({ difficulty: 'easy', bank, seed: 7 });
    const b = generateWithRetries({ difficulty: 'easy', bank, seed: 7 });
    expect(a).toEqual(b);
  });

  it('exclude edilen kelimeler kullanılmaz', () => {
    const first = generateWithRetries({ difficulty: 'easy', bank, seed: 3 });
    const exclude = new Set(first.words.map((w) => w.word));
    const second = generateWithRetries({ difficulty: 'easy', bank, seed: 3, exclude });
    for (const w of second.words) expect(exclude.has(w.word)).toBe(false);
  });
});

describe('validateGenerated — aynı başlangıçta çakışan entry (canlı hata regresyonu)', () => {
  it('bir kelimenin diğerinin ön eki olduğu ve aynı (row,col,dir) üzerinde başladığı durumu reddeder', () => {
    // Gerçek üretimde görülen ÇAM/ÇAMUR çakışması: "ÇAMUR" (row0,col0,down,len5)
    // zaten yerleşmişken "ÇAM" (row0,col0,down,len3) aynı hücrelerin ilk 3'ünü
    // "kesişim" olarak geçerli sanıp aynı başlangıçta ikinci bir entry olarak
    // kabul edilmiş — hashKey(0,down) her ikisi için de aynı olurdu.
    const solution = [
      ['Ç', null, null, null, null],
      ['A', null, null, null, null],
      ['M', null, null, null, null],
      ['U', null, null, null, null],
      ['R', null, null, null, null],
    ];
    const black = solution.map((row) => row.map((c) => c === null));
    const puzzle = {
      size: 5, black, solution,
      words: [
        { no: 1, dir: 'down' as const, row: 0, col: 0, len: 5, word: 'ÇAMUR', clue: 'x' },
        { no: 1, dir: 'down' as const, row: 0, col: 0, len: 3, word: 'ÇAM', clue: 'y' },
      ],
    };
    expect(validateGenerated(puzzle)).toEqual(['aynı başlangıçta çakışan entry: 0:0:down (ÇAM)']);
  });
});
