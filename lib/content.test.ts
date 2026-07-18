import { describe, expect, it } from 'vitest';
import { loadBank, validateBank } from './content';

describe('validateBank', () => {
  it('geçersiz kelimeyi (alfabe dışı / kısa) reddeder', () => {
    expect(() => validateBank([{ word: 'TAXİ', clues: ['x'], difficulty: 1 }])).toThrow();
    expect(() => validateBank([{ word: 'AŞ', clues: ['x'], difficulty: 1 }])).toThrow();
  });
  it('küçük harfli kelimeyi reddeder (banka her zaman büyük harf tutar)', () => {
    expect(() => validateBank([{ word: 'kalem', clues: ['x'], difficulty: 1 }])).toThrow();
  });
  it('ipucusuz veya difficulty aralık dışı girdiyi reddeder', () => {
    expect(() => validateBank([{ word: 'KALEM', clues: [], difficulty: 1 }])).toThrow();
    expect(() => validateBank([{ word: 'KALEM', clues: ['x'], difficulty: 4 }])).toThrow();
  });
  it('tekrar eden kelimeyi reddeder', () => {
    const e = { word: 'KALEM', clues: ['xyz'], difficulty: 1 };
    expect(() => validateBank([e, e])).toThrow(/tekrar/i);
  });
});

describe('loadBank (gerçek dosya)', () => {
  it('en az 120 geçerli girdi içerir', () => {
    expect(loadBank().length).toBeGreaterThanOrEqual(120);
  });
  it('her zorluk seviyesinden en az 30 kelime vardır', () => {
    const bank = loadBank();
    for (const d of [1, 2, 3] as const) {
      expect(bank.filter((e) => e.difficulty === d).length).toBeGreaterThanOrEqual(30);
    }
  });
  it('3-10 harf yelpazesinde çeşitlilik vardır (en az 6 farklı uzunluk)', () => {
    expect(new Set(loadBank().map((e) => e.word.length)).size).toBeGreaterThanOrEqual(6);
  });
});
