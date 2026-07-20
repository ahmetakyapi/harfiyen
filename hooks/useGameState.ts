'use client';

import { useMemo, useReducer } from 'react';
import { isTrLetter } from '@/lib/tr';
import type { Direction, Entry, Letters } from '@/lib/types';

export type GridCtx = { size: number; black: boolean[][]; entries: Entry[] };
export type Selection = { row: number; col: number; dir: Direction };
export type GameState = { letters: Letters; sel: Selection };
// protectedCells (`${row}:${col}`): doğrulanmış (yeşil) + ipucuyla açılmış
// hücreler — TYPE üzerine yazamaz, DELETE/CLEAR_* silemez.
export type GameAction =
  | { type: 'SELECT'; row: number; col: number }
  | { type: 'TYPE'; letter: string; protectedCells?: Set<string> }
  | { type: 'DELETE'; protectedCells?: Set<string> }
  | { type: 'NEXT_ENTRY'; delta: 1 | -1 }
  | { type: 'MOVE'; dRow: number; dCol: number }
  | { type: 'SET_LETTERS'; letters: Letters }
  | { type: 'REVEAL'; row: number; col: number; letter: string }
  | { type: 'NEXT_INCOMPLETE' }
  | { type: 'CLEAR_WORD'; protectedCells: Set<string> }
  | { type: 'CLEAR_ALL'; protectedCells: Set<string> };

const other = (d: Direction): Direction => (d === 'across' ? 'down' : 'across');

export function cellsOf(e: Entry): { row: number; col: number }[] {
  return Array.from({ length: e.len }, (_, i) => ({
    row: e.dir === 'down' ? e.row + i : e.row,
    col: e.dir === 'across' ? e.col + i : e.col,
  }));
}

export function entryAt(ctx: GridCtx, row: number, col: number, dir: Direction): Entry | undefined {
  return ctx.entries.find(
    (e) => e.dir === dir && cellsOf(e).some((c) => c.row === row && c.col === col),
  );
}

export function activeEntry(ctx: GridCtx, sel: Selection): Entry {
  const entry = entryAt(ctx, sel.row, sel.col, sel.dir) ?? entryAt(ctx, sel.row, sel.col, other(sel.dir));
  if (!entry) throw new Error('seçim hiçbir kelimenin üzerinde değil');
  return entry;
}

export function orderedEntries(ctx: GridCtx): Entry[] {
  return [...ctx.entries].sort((a, b) =>
    a.dir === b.dir ? a.no - b.no : a.dir === 'across' ? -1 : 1,
  );
}

export function entryString(letters: Letters, e: Entry): string | null {
  let out = '';
  for (const c of cellsOf(e)) {
    const l = letters[c.row][c.col];
    if (l === null) return null;
    out += l;
  }
  return out;
}

export function allCellsFilled(ctx: GridCtx, letters: Letters): boolean {
  for (let r = 0; r < ctx.size; r++) {
    for (let c = 0; c < ctx.size; c++) {
      if (!ctx.black[r][c] && letters[r][c] === null) return false;
    }
  }
  return true;
}

export function initialState(ctx: GridCtx): GameState {
  const first = orderedEntries(ctx)[0];
  return {
    letters: Array.from({ length: ctx.size }, () => Array.from({ length: ctx.size }, () => null)),
    sel: { row: first.row, col: first.col, dir: first.dir },
  };
}

function selAtEntry(entry: Entry, letters: Letters): Selection {
  const empty = cellsOf(entry).find((c) => letters[c.row][c.col] === null) ?? cellsOf(entry)[0];
  return { row: empty.row, col: empty.col, dir: entry.dir };
}

// Yazınca ilerleme: aktif kelimenin İÇİNDE kal. Sıradaki boş hücreye geç;
// hepsi doluysa bir sonraki hücreye döngüsel olarak geç (BAŞKA kelimeye
// ATLAMA). Sonraki soruya geçiş yalnızca kelime DOĞRU tamamlanınca olur ve
// bunu GameBoard yönetir (NEXT_INCOMPLETE) — çünkü doğruluk (hash) yalnızca
// orada, asenkron bilinir. Böylece yanlış/eksik bir kelimede takılıp kalır,
// kullanıcı harflerini düzeltebilir; yanlışken bir sonraki soruya kaymaz.
function advance(ctx: GridCtx, letters: Letters, sel: Selection): Selection {
  const entry = activeEntry(ctx, sel);
  const cells = cellsOf(entry);
  const idx = cells.findIndex((c) => c.row === sel.row && c.col === sel.col);
  const after = cells.slice(idx + 1).find((c) => letters[c.row][c.col] === null);
  if (after) return { row: after.row, col: after.col, dir: entry.dir };
  const before = cells.find((c) => letters[c.row][c.col] === null);
  if (before) return { row: before.row, col: before.col, dir: entry.dir };
  // kelime dolu → aynı kelimede kal, döngüsel olarak bir sonraki hücreye geç
  const next = cells[(idx + 1) % cells.length];
  return { row: next.row, col: next.col, dir: entry.dir };
}

// Sıradaki EKSİK (boş hücresi olan) kelimenin ilk boş hücresine git. Aktif
// kelime doğru tamamlanınca GameBoard bunu tetikler → otomatik sonraki soru.
function nextIncomplete(ctx: GridCtx, letters: Letters, sel: Selection): Selection {
  const list = orderedEntries(ctx);
  const entry = activeEntry(ctx, sel);
  const from = list.findIndex((e) => e.no === entry.no && e.dir === entry.dir);
  for (let i = 1; i <= list.length; i++) {
    const cand = list[(from + i) % list.length];
    if (cellsOf(cand).some((c) => letters[c.row][c.col] === null)) return selAtEntry(cand, letters);
  }
  return sel; // grid dolu
}

const cloneLetters = (l: Letters): Letters => l.map((row) => [...row]);

export function createReducer(ctx: GridCtx) {
  return (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'SELECT': {
        const { row, col } = action;
        if (row < 0 || col < 0 || row >= ctx.size || col >= ctx.size || ctx.black[row][col]) return state;
        if (!entryAt(ctx, row, col, state.sel.dir) && !entryAt(ctx, row, col, other(state.sel.dir))) return state;
        if (row === state.sel.row && col === state.sel.col && entryAt(ctx, row, col, other(state.sel.dir))) {
          return { ...state, sel: { row, col, dir: other(state.sel.dir) } };
        }
        const dir = entryAt(ctx, row, col, state.sel.dir) ? state.sel.dir : other(state.sel.dir);
        return { ...state, sel: { row, col, dir } };
      }
      case 'TYPE': {
        if (!isTrLetter(action.letter)) return state;
        // Kilitli hücrenin üzerine yazılmaz — yazma akışı bozulmasın diye
        // harf değişmeden bir sonraki boş hücreye ilerlenir.
        if (action.protectedCells?.has(`${state.sel.row}:${state.sel.col}`)) {
          return { ...state, sel: advance(ctx, state.letters, state.sel) };
        }
        const letters = cloneLetters(state.letters);
        letters[state.sel.row][state.sel.col] = action.letter;
        return { letters, sel: advance(ctx, letters, state.sel) };
      }
      case 'REVEAL': {
        const letters = cloneLetters(state.letters);
        letters[action.row][action.col] = action.letter;
        const sel = action.row === state.sel.row && action.col === state.sel.col
          ? advance(ctx, letters, state.sel) : state.sel;
        return { letters, sel };
      }
      case 'DELETE': {
        const prot = action.protectedCells;
        const letters = cloneLetters(state.letters);
        const { row, col } = state.sel;
        // Kilitli dolu hücre "silinebilir" sayılmaz: boşmuş gibi bir geri gidilir.
        if (letters[row][col] !== null && !prot?.has(`${row}:${col}`)) {
          letters[row][col] = null;
          return { letters, sel: state.sel };
        }
        const cells = cellsOf(activeEntry(ctx, state.sel));
        const idx = cells.findIndex((c) => c.row === row && c.col === col);
        if (idx <= 0) return state;
        const prev = cells[idx - 1];
        // Geri gidilen hücre kilitliyse harfi kalır, yalnızca seçim üzerine gelir —
        // arka arkaya backspace kilitli hücrelerin üzerinden akıp geçer.
        if (!prot?.has(`${prev.row}:${prev.col}`)) letters[prev.row][prev.col] = null;
        return { letters, sel: { ...state.sel, row: prev.row, col: prev.col } };
      }
      case 'NEXT_ENTRY': {
        const list = orderedEntries(ctx);
        const entry = activeEntry(ctx, state.sel);
        const from = list.findIndex((e) => e.no === entry.no && e.dir === entry.dir);
        const next = list[(from + action.delta + list.length) % list.length];
        return { ...state, sel: selAtEntry(next, state.letters) };
      }
      case 'NEXT_INCOMPLETE':
        return { ...state, sel: nextIncomplete(ctx, state.letters, state.sel) };
      case 'MOVE': {
        let { row, col } = state.sel;
        for (;;) {
          row += action.dRow;
          col += action.dCol;
          if (row < 0 || col < 0 || row >= ctx.size || col >= ctx.size) return state;
          if (!ctx.black[row][col]) return { ...state, sel: { ...state.sel, row, col } };
        }
      }
      case 'SET_LETTERS':
        return { ...state, letters: action.letters };
      case 'CLEAR_WORD': {
        const letters = cloneLetters(state.letters);
        for (const c of cellsOf(activeEntry(ctx, state.sel))) {
          if (!action.protectedCells.has(`${c.row}:${c.col}`)) letters[c.row][c.col] = null;
        }
        return { ...state, letters };
      }
      case 'CLEAR_ALL': {
        const letters = cloneLetters(state.letters);
        for (let r = 0; r < ctx.size; r++) {
          for (let c = 0; c < ctx.size; c++) {
            if (ctx.black[r][c] || action.protectedCells.has(`${r}:${c}`)) continue;
            letters[r][c] = null;
          }
        }
        return { ...state, letters };
      }
      default:
        return state;
    }
  };
}

export function useGameState(ctx: GridCtx): [GameState, React.Dispatch<GameAction>] {
  const reducer = useMemo(() => createReducer(ctx), [ctx]);
  return useReducer(reducer, ctx, initialState);
}
