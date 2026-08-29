import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { addDays, gameDay, trtDate } from '@/lib/date';
import type { Db } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

export type ProfileStats = {
  username: string; memberSince: string; currentStreak: number; bestStreak: number;
  totalSolved: number;
  /** Arşiv (pratik) modunda çözülen FARKLI bulmaca sayısı. */
  practiceSolved: number;
  perDifficulty: Record<Difficulty, { solved: number; bestMs: number | null; avgMs: number | null }>;
  recent: { date: string; difficulty: Difficulty; durationMs: number }[];
  /** Son 56 gün: tarih → o gün bitirilen zorluk sayısı (0-3). */
  calendar: Record<string, number>;
};

// Isı takvimi 8 tam hafta gösterir: bir aylık pencereden uzun, sonsuz
// büyümeyecek kadar kısa.
export const CALENDAR_DAYS = 56;

export async function getProfileStats(db: Db, username: string): Promise<ProfileStats | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return null;

  const mine = and(eq(playSessions.userId, user.id), eq(playSessions.status, 'completed'));
  const ranked = and(mine, eq(playSessions.isRanked, true));
  // Takvim OYUN gününü izler: TSİ 00:00-09:00 arasında takvim günü ilerlemiş
  // olur ama o günün bulmacaları henüz açılmamıştır.
  const since = addDays(gameDay(), -CALENDAR_DAYS);

  // Eskiden kullanıcının BÜTÜN oturumları Node'a çekilip orada toplanıyordu;
  // her sütun aggregate'e taşındı ve dört sorgu paralel gidiyor.
  const [byDifficulty, recentRows, practiceRows, calendarRows] = await Promise.all([
    db.select({
      difficulty: puzzles.difficulty,
      solved: sql<number>`count(*)`,
      bestMs: sql<number | null>`min(${playSessions.durationMs})`,
      avgMs: sql<number | null>`avg(${playSessions.durationMs})`,
    }).from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(ranked)
      .groupBy(puzzles.difficulty),
    db.select({
      date: puzzles.date, difficulty: puzzles.difficulty, durationMs: playSessions.durationMs,
    }).from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(ranked)
      .orderBy(desc(playSessions.submittedAt))
      .limit(10),
    // Arşivde aynı bulmaca birden çok kez çözülebiliyor: DISTINCT olmadan
    // "çözülen" sayısı tekrar oynamalarla şişerdi.
    db.select({ n: sql<number>`count(distinct ${playSessions.puzzleId})` })
      .from(playSessions)
      .where(and(mine, eq(playSessions.isRanked, false))),
    db.select({
      date: puzzles.date,
      n: sql<number>`count(distinct ${puzzles.difficulty})`,
    }).from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(and(ranked, gte(puzzles.date, since)))
      .groupBy(puzzles.date),
  ]);

  const perDifficulty = Object.fromEntries(DIFFICULTIES.map((d) => {
    const row = byDifficulty.find((r) => r.difficulty === d);
    return [d, {
      solved: Number(row?.solved ?? 0),
      bestMs: row?.bestMs == null ? null : Number(row.bestMs),
      // avg() numeric döner; sürücü string olarak taşır.
      avgMs: row?.avgMs == null ? null : Math.round(Number(row.avgMs)),
    }];
  })) as ProfileStats['perDifficulty'];

  const calendar: Record<string, number> = {};
  for (const r of calendarRows) calendar[r.date] = Number(r.n);

  return {
    username: user.username,
    // toISOString UTC keser: TSİ 00:00-02:59 arasında kaydolanların üyelik
    // tarihi bir gün geride görünüyordu.
    memberSince: trtDate(user.createdAt),
    currentStreak: user.currentStreak, bestStreak: user.bestStreak,
    totalSolved: DIFFICULTIES.reduce((n, d) => n + perDifficulty[d].solved, 0),
    practiceSolved: Number(practiceRows[0]?.n ?? 0),
    perDifficulty,
    recent: recentRows.map((r) => ({
      date: r.date, difficulty: r.difficulty, durationMs: r.durationMs ?? 0,
    })),
    calendar,
  };
}
