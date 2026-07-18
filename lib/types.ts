export type Difficulty = 'easy' | 'medium' | 'hard';
export type Direction = 'across' | 'down'; // across = soldan sağa, down = yukarıdan aşağıya
export type Entry = { no: number; dir: Direction; row: number; col: number; len: number; clue: string };
export type Letters = (string | null)[][]; // null = siyah hücre / boş
export type ClientPuzzle = {
  id: number; publicId: string; date: string; difficulty: Difficulty; size: number;
  black: boolean[][]; entries: Entry[]; wordHashes: Record<string, string>; // key: `${no}:${dir}`
};
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
export const SIZE_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 6, medium: 8, hard: 10 };
export const HINT_PENALTY_MS = 15_000;
export function hashKey(no: number, dir: Direction): string { return `${no}:${dir}`; }
