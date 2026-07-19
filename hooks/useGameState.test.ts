import { describe, expect, it } from 'vitest';
import type { Entry } from '@/lib/types';
import {
  activeEntry, allCellsFilled, cellsOf, createReducer, entryString, initialState,
  type GridCtx,
} from './useGameState';

// Fikstür: 5x5, KALEM (1 soldan sağa) + 1 yukarıdan aşağıya (0,0) len 4 + 2 yukarıdan aşağıya (0,2) len 3
const entries: Entry[] = [
  { no: 1, dir: 'across', row: 0, col: 0, len: 5, clue: 'c1' },
  { no: 1, dir: 'down', row: 0, col: 0, len: 4, clue: 'c2' },
  { no: 2, dir: 'down', row: 0, col: 2, len: 3, clue: 'c3' },
];

function buildCtx(size: number, list: Entry[]): GridCtx {
  const black = Array.from({ length: size }, () => Array.from({ length: size }, () => true));
  for (const e of list) for (const c of cellsOf(e)) black[c.row][c.col] = false;
  return { size, black, entries: list };
}
const ctx = buildCtx(5, entries);
const reduce = createReducer(ctx);

describe('initialState', () => {
  it('ilk kelimenin başında, soldan sağa başlar', () => {
    expect(initialState(ctx).sel).toEqual({ row: 0, col: 0, dir: 'across' });
  });
});

describe('TYPE', () => {
  it('harf yazar ve sonraki boş hücreye ilerler', () => {
    const s1 = reduce(initialState(ctx), { type: 'TYPE', letter: 'K' });
    expect(s1.letters[0][0]).toBe('K');
    expect(s1.sel).toEqual({ row: 0, col: 1, dir: 'across' });
  });
  it('geçersiz karakteri yok sayar', () => {
    const s1 = reduce(initialState(ctx), { type: 'TYPE', letter: 'w' });
    expect(s1).toEqual(initialState(ctx));
  });
  it('kelime bitince boş hücresi olan sonraki kelimeye geçer', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    // across bitti → 1-down'un ilk boş hücresi (1,0)
    expect(s.sel).toEqual({ row: 1, col: 0, dir: 'down' });
  });
});

describe('SELECT', () => {
  it('aynı hücreye ikinci dokunuş yön değiştirir', () => {
    const s1 = reduce(initialState(ctx), { type: 'SELECT', row: 0, col: 0 });
    expect(s1.sel.dir).toBe('down');
  });
  it('yalnızca dikey kelimesi olan hücrede yön down olur', () => {
    const s1 = reduce(initialState(ctx), { type: 'SELECT', row: 1, col: 2 });
    expect(s1.sel).toEqual({ row: 1, col: 2, dir: 'down' });
  });
  it('siyah hücre yok sayılır', () => {
    const s1 = reduce(initialState(ctx), { type: 'SELECT', row: 4, col: 4 });
    expect(s1).toEqual(initialState(ctx));
  });
  it('hiç girdiye kapalı yetim hücre seçilmez', () => {
    // Yetim hücre: (4,4) beyaz ama hiçbir girdi tarafından kaplanmaz
    const orphanBlack = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => true));
    for (const e of entries) for (const c of cellsOf(e)) orphanBlack[c.row][c.col] = false;
    orphanBlack[4][4] = false; // (4,4)'ü beyaz yap ama girdileri değiştirme
    const orphanCtx: GridCtx = { size: 5, black: orphanBlack, entries };
    const orphanReduce = createReducer(orphanCtx);
    const s0 = initialState(orphanCtx);
    const s1 = orphanReduce(s0, { type: 'SELECT', row: 4, col: 4 });
    expect(s1).toEqual(s0);
  });
});

describe('DELETE', () => {
  it('dolu hücreyi temizler, yerinde kalır; boşta bir geri gidip temizler', () => {
    let s = reduce(initialState(ctx), { type: 'TYPE', letter: 'K' }); // sel (0,1)
    s = reduce(s, { type: 'DELETE' }); // (0,1) boş → geri git (0,0)'ı temizle
    expect(s.letters[0][0]).toBeNull();
    expect(s.sel).toEqual({ row: 0, col: 0, dir: 'across' });
    s = reduce(s, { type: 'TYPE', letter: 'K' });
    s = reduce(s, { type: 'SELECT', row: 0, col: 0 }); // seçimi (0,0)'a al (yön down olur)
    s = reduce(s, { type: 'DELETE' }); // dolu → temizle, yerinde kal
    expect(s.letters[0][0]).toBeNull();
    expect(s.sel.row).toBe(0);
  });
});

describe('MOVE', () => {
  it('siyah hücrelerin üzerinden atlar', () => {
    // (0,1)'den aşağı: (1,1) siyah… 1-down yalnızca sütun 0; sütun 1'de yalnız (0,1) beyaz → hareket etmez
    const s0 = { ...initialState(ctx), sel: { row: 0, col: 1, dir: 'across' as const } };
    expect(reduce(s0, { type: 'MOVE', dRow: 1, dCol: 0 }).sel).toEqual(s0.sel);
    // (0,0)'dan sağa zaten beyaz (0,1)
    expect(reduce(initialState(ctx), { type: 'MOVE', dRow: 0, dCol: 1 }).sel.col).toBe(1);
  });
});

describe('CLEAR_WORD', () => {
  it('yalnızca aktif kelimenin hücrelerini temizler, korunanları atlar', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    // sel şu an 1-down'a geçmiş olabilir; 1-across'u temizlemek için oraya seç
    s = reduce(s, { type: 'SELECT', row: 0, col: 1 });
    const cleared = reduce(s, { type: 'CLEAR_WORD', protectedCells: new Set() });
    expect(cleared.letters[0]).toEqual([null, null, null, null, null]);
  });
  it('korunan (doğru) hücreyi silmez, aynı kelimenin diğer hücrelerini siler', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    s = reduce(s, { type: 'SELECT', row: 0, col: 1 });
    const cleared = reduce(s, { type: 'CLEAR_WORD', protectedCells: new Set(['0:0']) });
    expect(cleared.letters[0][0]).toBe('K');
    expect(cleared.letters[0].slice(1)).toEqual([null, null, null, null]);
  });
});

describe('CLEAR_ALL', () => {
  it('siyah olmayan tüm hücreleri temizler', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    s = reduce(s, { type: 'SELECT', row: 1, col: 2 });
    s = reduce(s, { type: 'TYPE', letter: 'A' });
    const cleared = reduce(s, { type: 'CLEAR_ALL', protectedCells: new Set() });
    expect(cleared.letters[0]).toEqual([null, null, null, null, null]);
    expect(cleared.letters[1][2]).toBeNull();
  });
  it('korunan hücreleri her kelimede atlar', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    const cleared = reduce(s, { type: 'CLEAR_ALL', protectedCells: new Set(['0:0', '0:4']) });
    expect(cleared.letters[0]).toEqual(['K', null, null, null, 'M']);
  });
});

describe('kilitli hücreler (doğru/ipucu)', () => {
  it('TYPE kilitli hücrenin üzerine yazmaz, harf akışı bozulmadan ilerler', () => {
    let s = reduce(initialState(ctx), { type: 'TYPE', letter: 'K' }); // (0,0)='K', sel (0,1)
    s = reduce(s, { type: 'SELECT', row: 0, col: 0 });
    // 'B' geçerli bir Türkçe harf (X/W/Q alfabede yok, isTrLetter eler)
    const s2 = reduce(s, { type: 'TYPE', letter: 'B', protectedCells: new Set(['0:0']) });
    expect(s2.letters[0][0]).toBe('K');
    expect(s2.sel).toEqual({ row: 0, col: 1, dir: 'across' });
  });
  it('DELETE kilitli hücreyi silmez; backspace üzerinden akıp geçer', () => {
    let s = initialState(ctx);
    for (const l of ['K', 'A']) s = reduce(s, { type: 'TYPE', letter: l }); // sel (0,2)
    // (0,2) boş; bir geri: (0,1)='A' kilitli → harf kalır, seçim üzerine gelir
    const s2 = reduce(s, { type: 'DELETE', protectedCells: new Set(['0:1']) });
    expect(s2.letters[0][1]).toBe('A');
    expect(s2.sel).toEqual({ row: 0, col: 1, dir: 'across' });
    // kilitli dolu hücrede tekrar DELETE: yine silinmez, bir geri gidip (0,0)'ı siler
    const s3 = reduce(s2, { type: 'DELETE', protectedCells: new Set(['0:1']) });
    expect(s3.letters[0][1]).toBe('A');
    expect(s3.letters[0][0]).toBeNull();
    expect(s3.sel).toEqual({ row: 0, col: 0, dir: 'across' });
  });
});

describe('yardımcılar', () => {
  it('entryString eksikte null, tamamda kelime döner', () => {
    let s = initialState(ctx);
    expect(entryString(s.letters, entries[0])).toBeNull();
    for (const l of ['K', 'A', 'L', 'E', 'M']) s = reduce(s, { type: 'TYPE', letter: l });
    expect(entryString(s.letters, entries[0])).toBe('KALEM');
  });
  it('allCellsFilled ve activeEntry çalışır', () => {
    const s = initialState(ctx);
    expect(allCellsFilled(ctx, s.letters)).toBe(false);
    expect(activeEntry(ctx, s.sel).dir).toBe('across');
  });
});
