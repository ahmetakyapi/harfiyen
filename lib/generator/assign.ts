import { and, eq, gte, lt } from 'drizzle-orm';
import type { BankEntry } from '@/lib/content';
import { addDays } from '@/lib/date';
import type { Db } from '@/lib/db';
import { wordHash } from '@/lib/hash';
import { puzzles } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty, hashKey } from '@/lib/types';
import { generateWithRetries, type GeneratedPuzzle } from './generator';

function seedFor(date: string, difficulty: Difficulty, baseSeed: number): number {
  const dateNum = Number(date.replaceAll('-', ''));
  return (dateNum % 1_000_003) * 3 + DIFFICULTIES.indexOf(difficulty) + baseSeed * 7919;
}

export async function buildPuzzleRow(
  generated: GeneratedPuzzle, date: string, difficulty: Difficulty,
): Promise<typeof puzzles.$inferInsert> {
  const publicId = crypto.randomUUID().replaceAll('-', '');
  const wordHashes: Record<string, string> = {};
  for (const w of generated.words) {
    wordHashes[hashKey(w.no, w.dir)] = await wordHash(publicId, w.no, w.dir, w.word);
  }
  return {
    publicId, date, difficulty, size: generated.size,
    black: generated.black, solution: generated.solution,
    entries: generated.words.map(({ no, dir, row, col, len, clue }) => ({ no, dir, row, col, len, clue })),
    wordHashes,
    words: generated.words.map((w) => w.word),
  };
}

export const REPEAT_WINDOW_DAYS = 21;
const FALLBACK_WINDOWS = [REPEAT_WINDOW_DAYS, 14, 7, 0] as const;

async function excludedWords(
  db: Db, date: string, windowDays: number, sameDay: Set<string>,
): Promise<Set<string>> {
  if (windowDays === 0) return new Set(sameDay);
  const recent = await db.select({ words: puzzles.words }).from(puzzles)
    .where(and(gte(puzzles.date, addDays(date, -windowDays)), lt(puzzles.date, date)));
  return new Set([...sameDay, ...recent.flatMap((r) => r.words as string[])]);
}

export async function assignPuzzles(db: Db, opts: {
  bank: BankEntry[]; startDate: string; days: number; baseSeed?: number;
}): Promise<{ created: number; skipped: number }> {
  const baseSeed = opts.baseSeed ?? 1;
  let created = 0;
  let skipped = 0;
  for (let d = 0; d < opts.days; d++) {
    const date = addDays(opts.startDate, d);
    const sameDay = new Set<string>(); // aynı gün içinde kelime tekrarı KESİNLİKLE yasak
    for (const difficulty of DIFFICULTIES) {
      const existing = await db.select({ id: puzzles.id }).from(puzzles)
        .where(and(eq(puzzles.date, date), eq(puzzles.difficulty, difficulty)));
      if (existing.length > 0) { skipped++; continue; }
      // tekrar penceresi 21 gün; banka yetmezse kademeli daralt (14 → 7 → 0)
      let generated: GeneratedPuzzle | null = null;
      for (const windowDays of FALLBACK_WINDOWS) {
        const exclude = await excludedWords(db, date, windowDays, sameDay);
        try {
          generated = generateWithRetries({
            difficulty, bank: opts.bank, seed: seedFor(date, difficulty, baseSeed), exclude,
          });
          break;
        } catch {
          // bu pencereyle üretilemedi; pencereyi daraltıp yeniden dene
        }
      }
      if (!generated) throw new Error(`üretim başarısız: ${date} ${difficulty}`);
      for (const w of generated.words) sameDay.add(w.word);
      await db.insert(puzzles).values(await buildPuzzleRow(generated, date, difficulty));
      created++;
    }
  }
  return { created, skipped };
}
