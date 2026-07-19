import { describe, expect, it } from 'vitest';
import { loadBank } from '@/lib/content';
import { gameDay } from '@/lib/date';
import { buildPuzzleRow } from '@/lib/generator/assign';
import { generateWithRetries } from '@/lib/generator/generator';
import { puzzles, users } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { finishSession, startSession } from './session';
import { getProfileStats } from './stats';

const bank = loadBank();
const T0 = new Date('2026-07-30T09:00:00Z');
const today = gameDay(T0);

describe('getProfileStats', () => {
  it('zorluk bazında toplamları ve süreleri hesaplar', async () => {
    const db = await createTestDb();
    const [u] = await db.insert(users).values({ username: 'ahmet', passwordHash: 'x' }).returning();
    for (const [difficulty, seed, seconds] of [['easy', 31, 60], ['medium', 32, 150]] as const) {
      const g = generateWithRetries({ difficulty, bank, seed });
      const [p] = await db.insert(puzzles).values(await buildPuzzleRow(g, today, difficulty)).returning({ id: puzzles.id });
      const s = await startSession(db, { puzzleId: p.id, identity: { userId: u.id, anonId: null }, now: T0 });
      await finishSession(db, {
        sessionId: s.sessionId, identity: { userId: u.id, anonId: null },
        letters: g.solution, now: new Date(T0.getTime() + seconds * 1000),
      });
    }
    const stats = await getProfileStats(db, 'ahmet');
    if (!stats) throw new Error('stats null');
    expect(stats.totalSolved).toBe(2);
    expect(stats.perDifficulty.easy).toEqual({ solved: 1, bestMs: 60_000, avgMs: 60_000 });
    expect(stats.perDifficulty.medium.solved).toBe(1);
    expect(stats.perDifficulty.hard).toEqual({ solved: 0, bestMs: null, avgMs: null });
    expect(stats.currentStreak).toBe(1);
    expect(stats.recent).toHaveLength(2);
  });
  it('olmayan kullanıcıda null döner', async () => {
    const db = await createTestDb();
    expect(await getProfileStats(db, 'yok')).toBeNull();
  });
});
