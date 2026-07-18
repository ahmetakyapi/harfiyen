import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { loadBank } from '@/lib/content';
import { puzzles } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { assignPuzzles } from './assign';

const bank = loadBank();

describe('assignPuzzles', () => {
  it('2 gün için 6 bulmaca üretir; tekrar çağrı hiçbirini yeniden üretmez', async () => {
    const db = await createTestDb();
    const first = await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 1 });
    expect(first).toEqual({ created: 6, skipped: 0 });
    const second = await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 1 });
    expect(second).toEqual({ created: 0, skipped: 6 });
    const all = await db.select().from(puzzles);
    expect(all).toHaveLength(6);
  });

  it('satırlar tutarlıdır: wordHashes anahtar sayısı kelime sayısına eşit, entries cevap içermez', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 1, baseSeed: 2 });
    const [row] = await db.select().from(puzzles)
      .where(and(eq(puzzles.date, '2026-07-21'), eq(puzzles.difficulty, 'easy')));
    const entries = row.entries as { clue: string; word?: string }[];
    const hashes = row.wordHashes as Record<string, string>;
    const words = row.words as string[];
    expect(Object.keys(hashes)).toHaveLength(entries.length);
    expect(words).toHaveLength(entries.length);
    for (const e of entries) {
      expect(e.word).toBeUndefined(); // cevap sızıntısı yok
      expect(e.clue.length).toBeGreaterThan(0);
    }
  });

  it('ertesi günün bulmacası tekrar penceresindeki (21 gün) kelimeleri kullanmaz', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 3 });
    const all = await db.select().from(puzzles);
    const day1 = all.filter((p) => p.date === '2026-07-21').flatMap((p) => p.words as string[]);
    const day2 = all.filter((p) => p.date === '2026-07-22').flatMap((p) => p.words as string[]);
    for (const w of day2) expect(day1).not.toContain(w);
  });

  it('aynı günün üç bulmacası arasında kelime tekrarı yoktur', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 1, baseSeed: 4 });
    const all = await db.select().from(puzzles);
    const words = all.flatMap((p) => p.words as string[]);
    expect(new Set(words).size).toBe(words.length);
  });
});
