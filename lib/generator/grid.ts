import type { Direction, Letters } from '@/lib/types';

export type Placement = { word: string; row: number; col: number; dir: Direction };

export function emptyLetters(size: number): Letters {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

const at = (g: Letters, size: number, r: number, c: number): string | null =>
  r < 0 || c < 0 || r >= size || c >= size ? null : g[r][c];

export function canPlace(letters: Letters, size: number, p: Placement): number {
  const dr = p.dir === 'down' ? 1 : 0;
  const dc = p.dir === 'across' ? 1 : 0;
  const len = p.word.length;
  const endRow = p.row + dr * (len - 1);
  const endCol = p.col + dc * (len - 1);
  if (p.row < 0 || p.col < 0 || endRow >= size || endCol >= size) return -1;
  // uçlara bitişik hücreler boş olmalı (kazara uzama yasağı)
  if (at(letters, size, p.row - dr, p.col - dc) !== null) return -1;
  if (at(letters, size, endRow + dr, endCol + dc) !== null) return -1;

  let crossings = 0;
  for (let i = 0; i < len; i++) {
    const r = p.row + dr * i;
    const c = p.col + dc * i;
    const existing = letters[r][c];
    if (existing !== null) {
      if (existing !== p.word[i]) return -1;
      crossings++;
    } else {
      // yeni doldurulan hücrenin dik komşuları boş olmalı (paralel bitişme yasağı)
      if (at(letters, size, r - dc, c - dr) !== null) return -1;
      if (at(letters, size, r + dc, c + dr) !== null) return -1;
    }
  }
  if (crossings === len) return -1; // tam çakışma
  return crossings;
}

export function applyPlacement(letters: Letters, p: Placement): void {
  const dr = p.dir === 'down' ? 1 : 0;
  const dc = p.dir === 'across' ? 1 : 0;
  for (let i = 0; i < p.word.length; i++) {
    letters[p.row + dr * i][p.col + dc * i] = p.word[i];
  }
}

export function numberEntries(
  placements: Placement[],
): { no: number; dir: Direction; row: number; col: number; len: number; word: string }[] {
  const sorted = [...placements].sort(
    (a, b) => a.row - b.row || a.col - b.col || (a.dir === 'across' ? -1 : 1),
  );
  const numberByCell = new Map<string, number>();
  let next = 1;
  return sorted.map((p) => {
    const key = `${p.row}:${p.col}`;
    let no = numberByCell.get(key);
    if (no === undefined) {
      no = next++;
      numberByCell.set(key, no);
    }
    return { no, dir: p.dir, row: p.row, col: p.col, len: p.word.length, word: p.word };
  });
}
