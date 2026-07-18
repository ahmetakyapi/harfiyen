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
  it('en az 900 geçerli girdi içerir', () => {
    expect(loadBank().length).toBeGreaterThanOrEqual(900);
  });
  it('zorluk dağılımı: 1 için ≥270, 2 için ≥330, 3 için ≥180', () => {
    const bank = loadBank();
    expect(bank.filter((e) => e.difficulty === 1).length).toBeGreaterThanOrEqual(270);
    expect(bank.filter((e) => e.difficulty === 2).length).toBeGreaterThanOrEqual(330);
    expect(bank.filter((e) => e.difficulty === 3).length).toBeGreaterThanOrEqual(180);
  });
  it('kısa kelime havuzu geniştir (3-4 harf ≥ 180 adet)', () => {
    expect(loadBank().filter((e) => e.word.length <= 4).length).toBeGreaterThanOrEqual(180);
  });
  it('uzun kelimeler vardır (8+ harf ≥ 90 adet)', () => {
    expect(loadBank().filter((e) => e.word.length >= 8).length).toBeGreaterThanOrEqual(90);
  });
  it('kelimelerin en az yarısında 2+ ipucu varyantı vardır', () => {
    const bank = loadBank();
    expect(bank.filter((e) => e.clues.length >= 2).length).toBeGreaterThanOrEqual(bank.length / 2);
  });
});
