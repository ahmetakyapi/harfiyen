import { and, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { puzzles } from '@/lib/schema';
import type { ClientPuzzle, Difficulty, Entry } from '@/lib/types';

// İstemciye giden bulmaca alanları TEK BİR YERDE tanımlıdır. Bu, projenin en
// kritik değişmezidir (CLAUDE.md): `solution` ve `words` kolonları istemciye
// ASLA gitmez. Sorgu sayfanın içinde dururken bunu koruyan tek şey bir yorum
// satırıydı; biri `db.select()` (kolonsuz) yazsa cevaplar RSC payload'una
// sessizce gömülür ve testler de tip denetimi de yeşil kalırdı.
// Şimdi burada duruyor ve lib/game/puzzle.test.ts ile teste bağlı.
const CLIENT_COLUMNS = {
  id: puzzles.id, publicId: puzzles.publicId, date: puzzles.date,
  difficulty: puzzles.difficulty, size: puzzles.size,
  black: puzzles.black, entries: puzzles.entries, wordHashes: puzzles.wordHashes,
} as const;

export async function getClientPuzzle(
  db: Db, date: string, difficulty: Difficulty,
): Promise<ClientPuzzle | null> {
  const [row] = await db.select(CLIENT_COLUMNS).from(puzzles)
    .where(and(eq(puzzles.date, date), eq(puzzles.difficulty, difficulty)));
  if (!row) return null;
  return {
    id: row.id, publicId: row.publicId, date: row.date, difficulty: row.difficulty,
    size: row.size, black: row.black as boolean[][], entries: row.entries as Entry[],
    wordHashes: row.wordHashes as Record<string, string>,
  };
}

/** Test amaçlı: istemciye giden kolon adları. */
export const CLIENT_PUZZLE_COLUMNS = Object.keys(CLIENT_COLUMNS);
