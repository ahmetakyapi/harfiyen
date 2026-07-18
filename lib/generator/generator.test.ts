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
