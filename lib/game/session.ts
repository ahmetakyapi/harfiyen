import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';
import { HINT_PENALTY_MS } from '@/lib/types';
import { applyStreak } from './streak';

export type Identity = { userId: number | null; anonId: string | null };

export class SessionError extends Error {
  constructor(public code: 'NOT_FOUND' | 'FORBIDDEN' | 'NOT_ACTIVE' | 'INVALID_CELL' | 'PUZZLE_NOT_FOUND') {
    super(code);
  }
}

const MIN_HUMAN_MS = 5_000;

function identityFilter(identity: Identity) {
  return identity.userId !== null
    ? eq(playSessions.userId, identity.userId)
    : and(isNull(playSessions.userId), eq(playSessions.anonId, identity.anonId ?? ''));
}

function assertOwnership(row: typeof playSessions.$inferSelect, identity: Identity): void {
  const owns = identity.userId !== null
    ? row.userId === identity.userId
    : row.userId === null && row.anonId !== null && row.anonId === identity.anonId;
  if (!owns) throw new SessionError('FORBIDDEN');
}

export type StartResult = {
  sessionId: number; startedAt: string; serverNow: string; existing: boolean;
  status: 'active' | 'completed'; hintCount: number; penaltyMs: number;
  durationMs: number | null; isRanked: boolean;
};

export async function startSession(db: Db, opts: {
  puzzleId: number; identity: Identity; replay?: boolean; now?: Date;
}): Promise<StartResult> {
  const now = opts.now ?? new Date();
  const [puzzle] = await db.select({ id: puzzles.id, date: puzzles.date }).from(puzzles)
    .where(eq(puzzles.id, opts.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');

  const mine = await db.select().from(playSessions)
    .where(and(eq(playSessions.puzzleId, opts.puzzleId), identityFilter(opts.identity)));
  const active = mine.find((s) => s.status === 'active');
  const completed = mine.find((s) => s.status === 'completed');

  const toResult = (row: typeof playSessions.$inferSelect, existing: boolean): StartResult => ({
    sessionId: row.id, startedAt: row.startedAt.toISOString(), serverNow: now.toISOString(),
    existing, status: row.status, hintCount: row.hintCount, penaltyMs: row.penaltyMs,
    durationMs: row.durationMs, isRanked: row.isRanked,
  });

  if (active) return toResult(active, true);
  if (completed && !opts.replay) return toResult(completed, true);

  const isRanked =
    opts.identity.userId !== null && puzzle.date === gameDay(now) && !completed;
  const [row] = await db.insert(playSessions).values({
    userId: opts.identity.userId, anonId: opts.identity.userId ? null : opts.identity.anonId,
    puzzleId: opts.puzzleId, startedAt: now, isRanked,
  }).returning();
  return toResult(row, false);
}

async function loadOwnedSession(db: Db, sessionId: number, identity: Identity) {
  const [row] = await db.select().from(playSessions).where(eq(playSessions.id, sessionId));
  if (!row) throw new SessionError('NOT_FOUND');
  assertOwnership(row, identity);
  return row;
}

export async function useHint(db: Db, opts: {
  sessionId: number; identity: Identity; row: number; col: number; now?: Date;
}): Promise<{ letter: string; hintCount: number; penaltyMs: number }> {
  const session = await loadOwnedSession(db, opts.sessionId, opts.identity);
  if (session.status !== 'active') throw new SessionError('NOT_ACTIVE');
  const [puzzle] = await db.select({ solution: puzzles.solution }).from(puzzles)
    .where(eq(puzzles.id, session.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  const solution = puzzle.solution as (string | null)[][];
  const letter = solution[opts.row]?.[opts.col] ?? null;
  if (letter === null) throw new SessionError('INVALID_CELL');
  const [updated] = await db.update(playSessions)
    .set({
      hintCount: sql`${playSessions.hintCount} + 1`,
      penaltyMs: sql`${playSessions.penaltyMs} + ${HINT_PENALTY_MS}`,
    })
    .where(eq(playSessions.id, session.id))
    .returning({ hintCount: playSessions.hintCount, penaltyMs: playSessions.penaltyMs });
  return { letter, hintCount: updated.hintCount, penaltyMs: updated.penaltyMs };
}

export type FinishResult =
  | { correct: false }
  | { correct: true; durationMs: number; isRanked: boolean; rank: number | null; alreadyCompleted: boolean };

export async function finishSession(db: Db, opts: {
  sessionId: number; identity: Identity; letters: (string | null)[][]; now?: Date;
}): Promise<FinishResult> {
  const now = opts.now ?? new Date();
  const session = await loadOwnedSession(db, opts.sessionId, opts.identity);

  if (session.status === 'completed') {
    const rank = session.isRanked ? await rankOf(db, session.puzzleId, session.durationMs ?? 0, session.submittedAt ?? now) : null;
    return {
      correct: true, durationMs: session.durationMs ?? 0,
      isRanked: session.isRanked, rank, alreadyCompleted: true,
    };
  }

  const [puzzle] = await db.select({ solution: puzzles.solution, date: puzzles.date }).from(puzzles)
    .where(eq(puzzles.id, session.puzzleId));
  if (!puzzle) throw new SessionError('PUZZLE_NOT_FOUND');
  const solution = puzzle.solution as (string | null)[][];

  const matches = solution.every((rowArr, r) =>
    rowArr.every((cell, c) => (opts.letters[r]?.[c] ?? null) === cell),
  );
  if (!matches) return { correct: false };

  const elapsed = now.getTime() - session.startedAt.getTime();
  const durationMs = elapsed + session.penaltyMs;
  await db.update(playSessions).set({
    status: 'completed', submittedAt: now, durationMs, flagged: elapsed < MIN_HUMAN_MS,
  }).where(eq(playSessions.id, session.id));

  let rank: number | null = null;
  if (session.isRanked) {
    rank = await rankOf(db, session.puzzleId, durationMs, now);
    if (session.userId !== null) await applyStreak(db, session.userId, puzzle.date);
  }
  return { correct: true, durationMs, isRanked: session.isRanked, rank, alreadyCompleted: false };
}

async function rankOf(db: Db, puzzleId: number, durationMs: number, submittedAt: Date): Promise<number> {
  const better = await db.select({ n: sql<number>`count(*)` }).from(playSessions).where(and(
    eq(playSessions.puzzleId, puzzleId),
    eq(playSessions.isRanked, true),
    eq(playSessions.status, 'completed'),
    or(
      lt(playSessions.durationMs, durationMs),
      and(eq(playSessions.durationMs, durationMs), lt(playSessions.submittedAt, submittedAt)),
    ),
  ));
  return Number(better[0].n) + 1;
}
