import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { applyStreak, nextStreak } from './streak';

describe('nextStreak', () => {
  const s0 = { currentStreak: 0, bestStreak: 0, lastStreakDate: null };
  it('ilk gün 1 yapar', () => {
    expect(nextStreak(s0, '2026-07-21')).toEqual({ currentStreak: 1, bestStreak: 1, lastStreakDate: '2026-07-21' });
  });
  it('ardışık gün artırır, aynı gün değiştirmez, boşluk 1e döndürür', () => {
    const d1 = nextStreak(s0, '2026-07-21');
    const d2 = nextStreak(d1, '2026-07-22');
    expect(d2.currentStreak).toBe(2);
    expect(nextStreak(d2, '2026-07-22')).toEqual(d2);
    const gap = nextStreak(d2, '2026-07-25');
    expect(gap).toEqual({ currentStreak: 1, bestStreak: 2, lastStreakDate: '2026-07-25' });
  });
});

describe('applyStreak', () => {
  it('users tablosunu günceller', async () => {
    const db = await createTestDb();
    const [u] = await db.insert(users).values({ username: 'ahmet', passwordHash: 'x' }).returning();
    await applyStreak(db, u.id, '2026-07-21');
    await applyStreak(db, u.id, '2026-07-22');
    const [after] = await db.select().from(users).where(eq(users.id, u.id));
    expect(after.currentStreak).toBe(2);
    expect(after.bestStreak).toBe(2);
    expect(after.lastStreakDate).toBe('2026-07-22');
  });
});
