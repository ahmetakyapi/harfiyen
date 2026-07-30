import { describe, expect, it } from 'vitest';
import { KEYBOARD_LETTERS, KEY_ROWS, LOWERCASE_HINT, coversAlphabet } from './keyboard';
import { TR_LETTERS, isTrLetter } from './tr';

describe('ekran klavyesi düzeni', () => {
  it('Türkçe alfabenin tamamını tam olarak bir kez kapsar', () => {
    expect(coversAlphabet()).toBe(true);
    expect(KEYBOARD_LETTERS).toHaveLength(TR_LETTERS.length);
  });

  it('her tuş geçerli bir Türkçe büyük harftir (Q/W/X yok)', () => {
    for (const key of KEYBOARD_LETTERS) expect(isTrLetter(key)).toBe(true);
    for (const banned of ['Q', 'W', 'X']) expect(KEYBOARD_LETTERS).not.toContain(banned);
  });

  it('üç satır, Q-klavye sırasını korur ve hiçbir satır 11 tuşu geçmez', () => {
    expect(KEY_ROWS).toHaveLength(3);
    expect(KEY_ROWS[0][0]).toBe('E'); // "erty…"
    expect(KEY_ROWS[1][0]).toBe('A'); // "asdf…"
    expect(KEY_ROWS[2][0]).toBe('Z'); // "zcvb…"
    for (const row of KEY_ROWS) expect(row.length).toBeLessThanOrEqual(11);
  });

  it('yalnızca karışan I/İ çifti için küçük harf ipucu taşır', () => {
    expect(Object.keys(LOWERCASE_HINT).sort()).toEqual(['I', 'İ']);
    expect(LOWERCASE_HINT.I).toBe('ı');
    expect(LOWERCASE_HINT['İ']).toBe('i');
  });
});
