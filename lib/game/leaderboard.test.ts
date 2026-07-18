import { describe, expect, it } from 'vitest';
import { loadBank } from '@/lib/content';
import { gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { buildPuzzleRow } from '@/lib/generator/assign';
import { generateWithRetries } from '@/lib/generator/generator';
import { puzzles, users } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { finishSession, startSession } from './session';
import { getLeaderboard } from './leaderboard';

const T0 = new Date('2026-07-30T09:00:00Z'); // sabit test anı (TSİ 12:00)
const today = gameDay(T0);

async function setup(): Promise<{ db: Db; puzzleId: number; solution: (string | null)[][] }> {
  const db = await createTestDb();
  const generated = generateWithRetries({ difficulty: 'easy', bank: loadBank(), seed: 21 });
  const [p] = await db.insert(puzzles).values(await buildPuzzleRow(generated, today, 'easy')).returning({ id: puzzles.id });
  return { db, puzzleId: p.id, solution: generated.solution };
}

async function play(db: Db, puzzleId: number, solution: (string | null)[][], username: string, seconds: number): Promise<number> {
  const [u] = await db.insert(users).values({ username, passwordHash: 'x' }).returning({ id: users.id });
  const t0 = T0;
  const s = await startSession(db, { puzzleId, identity: { userId: u.id, anonId: null }, now: t0 });
  await finishSession(db, {
    sessionId: s.sessionId, identity: { userId: u.id, anonId: null },
    letters: solution, now: new Date(t0.getTime() + seconds * 1000),
  });
  return u.id;
}

describe('getLeaderboard', () => {
  it('süreye göre sıralar, me alanını doldurur', async () => {
    const { db, puzzleId, solution } = await setup();
    await play(db, puzzleId, solution, 'hizli', 60);
    await play(db, puzzleId, solution, 'orta_oyuncu', 90);
    const slowId = await play(db, puzzleId, solution, 'yavas', 120);
    const board = await getLeaderboard(db, { date: today, difficulty: 'easy', userId: slowId });
    if (!board) throw new Error('board null');
    expect(board.top.map((r) => r.username)).toEqual(['hizli', 'orta_oyuncu', 'yavas']);
    expect(board.top[0]).toMatchObject({ rank: 1, durationMs: 60_000 });
    expect(board.me).toEqual({ rank: 3, durationMs: 120_000 });
    expect(board.total).toBe(3);
  });
  it('bulmaca yoksa null döner', async () => {
    const db = await createTestDb();
    expect(await getLeaderboard(db, { date: '2020-01-01', difficulty: 'hard' })).toBeNull();
  });
});
