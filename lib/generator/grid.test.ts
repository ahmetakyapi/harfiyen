import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './rng';
import { applyPlacement, canPlace, emptyLetters, numberEntries } from './grid';

describe('rng', () => {
  it('aynı seed aynı diziyi üretir', () => {
    const a = shuffle(mulberry32(42), [1, 2, 3, 4, 5, 6, 7]);
    const b = shuffle(mulberry32(42), [1, 2, 3, 4, 5, 6, 7]);
    expect(a).toEqual(b);
  });
});

describe('canPlace', () => {
  it('boş grid: ilk kelime 0 kesişimle yerleşir', () => {
    const g = emptyLetters(7);
    expect(canPlace(g, 7, { word: 'KALEM', row: 3, col: 1, dir: 'across' })).toBe(0);
  });
  it('sınır aşımı geçersizdir', () => {
    const g = emptyLetters(7);
    expect(canPlace(g, 7, { word: 'KALEM', row: 3, col: 4, dir: 'across' })).toBe(-1);
  });
  it('kesişen dik yerleşim 1 kesişim döner', () => {
    const g = emptyLetters(7);
    applyPlacement(g, { word: 'KALEM', row: 3, col: 1, dir: 'across' });
    // ADAK dikeyde A harfinde kesişir: (3,2)=A → row 3'te başlasın: A(3,2) D(4,2) A(5,2) K(6,2)
    expect(canPlace(g, 7, { word: 'ADAK', row: 3, col: 2, dir: 'down' })).toBe(1);
  });
  it('harf uyuşmazlığı geçersizdir', () => {
    const g = emptyLetters(7);
    applyPlacement(g, { word: 'KALEM', row: 3, col: 1, dir: 'across' });
    expect(canPlace(g, 7, { word: 'DUT', row: 3, col: 2, dir: 'down' })).toBe(-1); // D ≠ A
  });
  it('yan yana paralel kelime (bitişik dolu komşu) geçersizdir', () => {
    const g = emptyLetters(7);
    applyPlacement(g, { word: 'KALEM', row: 3, col: 1, dir: 'across' });
    expect(canPlace(g, 7, { word: 'SALON', row: 4, col: 1, dir: 'across' })).toBe(-1);
  });
  it('kelimenin ucuna bitişik hücre doluysa geçersizdir (kazara uzama)', () => {
    const g = emptyLetters(7);
    applyPlacement(g, { word: 'KALEM', row: 3, col: 1, dir: 'across' });
    // (3,0) hücresi KALEM'in soluna değer → across kelime (3,?) oraya bitemez
    expect(canPlace(g, 7, { word: 'ADAK', row: 0, col: 0, dir: 'down' })).toBe(-1); // (3,0) K'ya bitişik biter... A-D-A-K (0..3,0): son hücre (3,0), sağı (3,1)='K' dolu ama dik komşu kuralı: down kelimenin yatay komşuları boş olmalı → geçersiz
  });
  it('tamamen çakışan yerleşim geçersizdir', () => {
    const g = emptyLetters(7);
    applyPlacement(g, { word: 'KALEM', row: 3, col: 1, dir: 'across' });
    expect(canPlace(g, 7, { word: 'KALEM', row: 3, col: 1, dir: 'across' })).toBe(-1);
  });
});

describe('numberEntries', () => {
  it('başlangıç hücrelerini satır-sütun sırasıyla numaralar, aynı hücre tek numara alır', () => {
    const entries = numberEntries([
      { word: 'KALEM', row: 0, col: 0, dir: 'across' },
      { word: 'KOZA', row: 0, col: 0, dir: 'down' },
      { word: 'ADAK', row: 0, col: 1, dir: 'down' },
    ]);
    expect(entries).toEqual([
      { no: 1, dir: 'across', row: 0, col: 0, len: 5, word: 'KALEM' },
      { no: 1, dir: 'down', row: 0, col: 0, len: 4, word: 'KOZA' },
      { no: 2, dir: 'down', row: 0, col: 1, len: 4, word: 'ADAK' },
    ]);
  });
});
