import { eq } from 'drizzle-orm';
import { addDays } from '@/lib/date';
import type { Db } from '@/lib/db';
import { users } from '@/lib/schema';

export type StreakState = { currentStreak: number; bestStreak: number; lastStreakDate: string | null };

export function nextStreak(s: StreakState, date: string): StreakState {
  // Seri ASLA geriye gitmez. Oturum başladığı güne bağlı olduğundan (spec §8)
  // dün açılmış bir oturum bugün tamamlanabilir; seri o bulmacanın tarihiyle
  // uygulandığı için eskiden bu, bugün kazanılmış seriyi 1'e düşürüyordu.
  if (s.lastStreakDate !== null && date <= s.lastStreakDate) return s;
  const current = s.lastStreakDate === addDays(date, -1) ? s.currentStreak + 1 : 1;
  return { currentStreak: current, bestStreak: Math.max(s.bestStreak, current), lastStreakDate: date };
}

/**
 * Ekranda gösterilecek seri. `users.current_streak` yalnızca bir bulmaca
 * BİTİRİLİNCE yazılır; oyuncu üç gün ara verse de tabloda eski sayı durur ve
 * ana sayfa/profil kopmuş bir seriyi "5 günlük seri" diye gösteriyordu. Son
 * seri günü bugün ya da dün değilse seri kopmuştur → 0.
 *
 * `atRisk`: seri dünle bitiyor, bugün henüz bir bulmaca bitirilmedi — bugün
 * bitirilmezse yarın kopacak.
 */
export function liveStreak(
  s: Pick<StreakState, 'currentStreak' | 'lastStreakDate'>, today: string,
): { current: number; atRisk: boolean } {
  const yesterday = addDays(today, -1);
  const alive = s.lastStreakDate === today || s.lastStreakDate === yesterday;
  const current = alive ? s.currentStreak : 0;
  return { current, atRisk: current > 0 && s.lastStreakDate === yesterday };
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
