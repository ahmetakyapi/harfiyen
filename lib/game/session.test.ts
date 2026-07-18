import { describe, expect, it } from 'vitest';
import { loadBank } from '@/lib/content';
import { addDays, gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { generateWithRetries } from '@/lib/generator/generator';
import { buildPuzzleRow } from '@/lib/generator/assign';
import { playSessions, puzzles, users } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { finishSession, startSession, useHint } from './session';

const bank = loadBank();

async function makePuzzle(db: Db, date: string): Promise<{ id: number; solution: (string | null)[][] }> {
  const generated = generateWithRetries({ difficulty: 'easy', bank, seed: 11 });
  const row = await buildPuzzleRow(generated, date, 'easy');
  const [p] = await db.insert(puzzles).values(row).returning({ id: puzzles.id });
  return { id: p.id, solution: generated.solution };
}

async function makeUser(db: Db, username = 'ahmet'): Promise<number> {
  const [u] = await db.insert(users).values({ username, passwordHash: 'x' }).returning({ id: users.id });
  return u.id;
}

const T0 = new Date('2026-07-30T09:00:00Z'); // sabit test anı (TSİ 12:00)
const today = gameDay(T0);

describe('startSession', () => {
  it('oturum açar; ikinci çağrı aynı oturumu döner', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const a = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: T0 });
    const b = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: T0 });
    expect(a.existing).toBe(false);
    expect(b.existing).toBe(true);
    expect(b.sessionId).toBe(a.sessionId);
    expect(a.isRanked).toBe(true); // üye + günün bulmacası
  });
  it('eşzamanlı iki çağrı aynı kimlik+bulmaca için tek aktif oturum üretir (race)', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const identity = { userId: uid, anonId: null };
    const [a, b] = await Promise.all([
      startSession(db, { puzzleId: p.id, identity, now: T0 }),
      startSession(db, { puzzleId: p.id, identity, now: T0 }),
    ]);
    expect(a.sessionId).toBe(b.sessionId);
    const { and, eq } = await import('drizzle-orm');
    const rows = await db.select().from(playSessions).where(
      and(eq(playSessions.puzzleId, p.id), eq(playSessions.userId, uid), eq(playSessions.status, 'active')),
    );
    expect(rows).toHaveLength(1);
  });
  it('misafir ve arşiv oturumları ranked değildir', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const guest = await startSession(db, { puzzleId: p.id, identity: { userId: null, anonId: 'anon-1' }, now: T0 });
    expect(guest.isRanked).toBe(false);
    const old = await makePuzzle(db, addDays(today, -3));
    const uid = await makeUser(db);
    const archive = await startSession(db, { puzzleId: old.id, identity: { userId: uid, anonId: null }, now: T0 });
    expect(archive.isRanked).toBe(false);
  });
});

describe('useHint', () => {
  it('çözümdeki harfi döner ve ceza biriktirir', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const s = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: T0 });
    let cell: { r: number; c: number } | null = null;
    outer: for (let r = 0; r < p.solution.length; r++) {
      for (let c = 0; c < p.solution.length; c++) {
        if (p.solution[r][c] !== null) { cell = { r, c }; break outer; }
      }
    }
    if (!cell) throw new Error('fikstürde beyaz hücre yok');
    const h1 = await useHint(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, row: cell.r, col: cell.c });
    expect(h1.letter).toBe(p.solution[cell.r][cell.c]);
    expect(h1.penaltyMs).toBe(15000);
    const h2 = await useHint(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, row: cell.r, col: cell.c });
    expect(h2.penaltyMs).toBe(30000);
  });
  it('siyah hücre için INVALID_CELL fırlatır', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const s = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: T0 });
    let black: { r: number; c: number } | null = null;
    outer: for (let r = 0; r < p.solution.length; r++) {
      for (let c = 0; c < p.solution.length; c++) {
        if (p.solution[r][c] === null) { black = { r, c }; break outer; }
      }
    }
    if (!black) return; // tümü beyazsa atla
    await expect(
      useHint(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, row: black.r, col: black.c }),
    ).rejects.toThrow('INVALID_CELL');
  });
});

describe('finishSession', () => {
  it('yanlış çözümde correct:false döner, oturum açık kalır; doğru çözümde süre = fark + ceza', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const t0 = T0;
    const s = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: t0 });
    const wrong = p.solution.map((row) => row.map((c) => (c === null ? null : 'A')));
    const r1 = await finishSession(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, letters: wrong });
    expect(r1).toEqual({ correct: false });
    await useHint(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, ...firstWhite(p.solution) });
    const t1 = new Date(t0.getTime() + 90_000);
    const r2 = await finishSession(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, letters: p.solution, now: t1 });
    if (!r2.correct) throw new Error('doğru çözüm reddedildi');
    expect(r2.durationMs).toBe(90_000 + 15_000);
    expect(r2.isRanked).toBe(true);
    expect(r2.rank).toBe(1);
    // idempotent
    const r3 = await finishSession(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, letters: wrong, now: new Date(t1.getTime() + 999_999) });
    expect(r3).toEqual({ ...r2, alreadyCompleted: true });
  });

  it('iki kullanıcıda yavaş olan 2. sırayı alır ve seri güncellenir', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const u1 = await makeUser(db, 'birinci');
    const u2 = await makeUser(db, 'ikinci');
    const t0 = T0;
    const s1 = await startSession(db, { puzzleId: p.id, identity: { userId: u1, anonId: null }, now: t0 });
    const s2 = await startSession(db, { puzzleId: p.id, identity: { userId: u2, anonId: null }, now: t0 });
    await finishSession(db, { sessionId: s1.sessionId, identity: { userId: u1, anonId: null }, letters: p.solution, now: new Date(t0.getTime() + 60_000) });
    const r2 = await finishSession(db, { sessionId: s2.sessionId, identity: { userId: u2, anonId: null }, letters: p.solution, now: new Date(t0.getTime() + 120_000) });
    if (!r2.correct) throw new Error('çözüm reddedildi');
    expect(r2.rank).toBe(2);
  });

  it('başka kimliğin oturumuna erişim FORBIDDEN', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const s = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: T0 });
    await expect(
      finishSession(db, { sessionId: s.sessionId, identity: { userId: null, anonId: 'yabanci' }, letters: p.solution }),
    ).rejects.toThrow('FORBIDDEN');
  });

  it('5 saniyeden hızlı bitiş flagged olur', async () => {
    const db = await createTestDb();
    const p = await makePuzzle(db, today);
    const uid = await makeUser(db);
    const t0 = T0;
    const s = await startSession(db, { puzzleId: p.id, identity: { userId: uid, anonId: null }, now: t0 });
    await finishSession(db, { sessionId: s.sessionId, identity: { userId: uid, anonId: null }, letters: p.solution, now: new Date(t0.getTime() + 2_000) });
    const { playSessions } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(playSessions).where(eq(playSessions.id, s.sessionId));
    expect(row.flagged).toBe(true);
  });
});

function firstWhite(solution: (string | null)[][]): { row: number; col: number } {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution.length; c++) {
      if (solution[r][c] !== null) return { row: r, col: c };
    }
  }
  throw new Error('beyaz hücre yok');
}
