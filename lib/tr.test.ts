import { describe, expect, it } from 'vitest';
import { TR_LETTERS, isTrLetter, isValidWord, trUpper } from './tr';

describe('trUpper', () => {
  it('i → İ ve ı → I dönüşümünü doğru yapar', () => {
    expect(trUpper('istanbul')).toBe('İSTANBUL');
    expect(trUpper('ılık')).toBe('ILIK');
    expect(trUpper('çığ')).toBe('ÇIĞ');
  });
});

describe('TR_LETTERS', () => {
  it('29 harf içerir, Q W X içermez', () => {
    expect(TR_LETTERS).toHaveLength(29);
    for (const ch of ['Q', 'W', 'X']) expect(TR_LETTERS).not.toContain(ch);
    for (const ch of ['Ç', 'Ğ', 'I', 'İ', 'Ö', 'Ş', 'Ü']) expect(TR_LETTERS).toContain(ch);
  });
});

describe('isTrLetter', () => {
  it('alfabe harflerini kabul, diğerlerini reddeder', () => {
    expect(isTrLetter('Ş')).toBe(true);
    expect(isTrLetter('W')).toBe(false);
    expect(isTrLetter('ş')).toBe(false); // küçük harf kabul edilmez
    expect(isTrLetter('AB')).toBe(false);
  });
});

describe('isValidWord', () => {
  it('3-10 harf sınırını ve alfabe kontrolünü uygular', () => {
    expect(isValidWord('KALEM')).toBe(true);
    expect(isValidWord('AŞ')).toBe(false); // 2 harf
    expect(isValidWord('ABCÇDEFGĞHI')).toBe(false); // 11 harf
    expect(isValidWord('TAXİ')).toBe(false); // X yok
    expect(isValidWord('KA LEM')).toBe(false);
  });
});
