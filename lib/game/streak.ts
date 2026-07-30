import { eq } from 'drizzle-orm';
import { addDays } from '@/lib/date';
import type { Db } from '@/lib/db';
import { users } from '@/lib/schema';

export type StreakState = { currentStreak: number; bestStreak: number; lastStreakDate: string | null };

export function nextStreak(s: StreakState, date: string): StreakState {
  if (s.lastStreakDate === date) return s;
  const current = s.lastStreakDate === addDays(date, -1) ? s.currentStreak + 1 : 1;
  return { currentStreak: current, bestStreak: Math.max(s.bestStreak, current), lastStreakDate: date };
}

/** Seriyi günceller ve GÜNCEL hâlini döner (bitiş ekranında gösterilir). */
export async function applyStreak(db: Db, userId: number, date: string): Promise<StreakState | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;
  const next = nextStreak(
    { currentStreak: user.currentStreak, bestStreak: user.bestStreak, lastStreakDate: user.lastStreakDate },
    date,
  );
  await db.update(users).set(next).where(eq(users.id, userId));
  return next;
}

export async function readStreak(db: Db, userId: number): Promise<StreakState | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;
  return {
    currentStreak: user.currentStreak, bestStreak: user.bestStreak, lastStreakDate: user.lastStreakDate,
  };
}
