import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

export type ProfileStats = {
  username: string; memberSince: string; currentStreak: number; bestStreak: number;
  totalSolved: number;
  perDifficulty: Record<Difficulty, { solved: number; bestMs: number | null; avgMs: number | null }>;
  recent: { date: string; difficulty: Difficulty; durationMs: number }[];
};

export async function getProfileStats(db: Db, username: string): Promise<ProfileStats | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return null;
  const rows = await db.select({
    date: puzzles.date, difficulty: puzzles.difficulty, durationMs: playSessions.durationMs,
    submittedAt: playSessions.submittedAt,
  }).from(playSessions)
    .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
    .where(and(
      eq(playSessions.userId, user.id),
      eq(playSessions.status, 'completed'),
      eq(playSessions.isRanked, true),
    ))
    .orderBy(desc(playSessions.submittedAt));

  const perDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => {
    const durations = rows.filter((r) => r.difficulty === d).map((r) => r.durationMs ?? 0);
    return [d, {
      solved: durations.length,
      bestMs: durations.length > 0 ? Math.min(...durations) : null,
      avgMs: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
    }];
  })) as ProfileStats['perDifficulty'];

  return {
    username: user.username,
    memberSince: user.createdAt.toISOString().slice(0, 10),
    currentStreak: user.currentStreak, bestStreak: user.bestStreak,
    totalSolved: rows.length, perDifficulty,
    recent: rows.slice(0, 10).map((r) => ({
      date: r.date, difficulty: r.difficulty, durationMs: r.durationMs ?? 0,
    })),
  };
}
