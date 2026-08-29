import { describe, expect, it } from 'vitest';
import { loadBank } from '@/lib/content';
import { addDays, gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { buildPuzzleRow } from '@/lib/generator/assign';
import { generateWithRetries } from '@/lib/generator/generator';
import { playSessions, puzzles, users } from '@/lib/schema';
import { createTestDb } from '@/tests/helpers/testDb';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { archivePageOf, getCalendarDays } from './calendar';

const bank = loadBank();
const NOW = new Date('2026-08-25T09:00:00Z'); // TSİ 12:00
const TODAY = gameDay(NOW);

async function seed(db: Db, dates: string[]): Promise<Record<string, Record<Difficulty, number>>> {
  const ids: Record<string, Record<Difficulty, number>> = {};
  for (const d of dates) {
    ids[d] = {} as Record<Difficulty, number>;
    for (const diff of DIFFICULTIES) {
      const g = generateWithRetries({ difficulty: diff, bank, seed: 7 + d.length });
      const [row] = await db.insert(puzzles).values(await buildPuzzleRow(g, d, diff))
        .returning({ id: puzzles.id });
      ids[d][diff] = row.id;
    }
  }
  return ids;
}

async function complete(db: Db, userId: number, puzzleId: number, ms: number): Promise<void> {
  await db.insert(playSessions).values({
    userId, puzzleId, startedAt: NOW, submittedAt: NOW,
    durationMs: ms, status: 'completed', isRanked: true,
  });
}

describe('getCalendarDays', () => {
  it('oynanmamış günler de listede kalır (LEFT JOIN koşulu ON\'da)', async () => {
    // En olası regresyon: kullanıcı koşullarının WHERE'e kayması. O zaman
    // LEFT JOIN fiilen INNER JOIN olur ve takvim yalnızca OYNANMIŞ günleri
    // gösterir — yani "veri var" işareti tamamen yanlış olur.
    const db = await createTestDb();
    const [u] = await db.insert(users).values({ username: 'ahmet', passwordHash: 'x' }).returning();
    const ids = await seed(db, ['2026-08-20', '2026-08-21']);
    await complete(db, u.id, ids['2026-08-20'].easy, 60_000);

    const days = await getCalendarDays(db, {
      from: '2026-08-01', to: '2026-08-31', userId: u.id, now: NOW,
    });
    expect(days.map((d) => d.date)).toEqual(['2026-08-20', '2026-08-21']);
    expect(days.find((d) => d.date === '2026-08-21')).toMatchObject({ puzzleCount: 3, doneCount: 0 });
  });

  it('aynı bulmacayı tekrar bitirmek sayacı şişirmez', async () => {
    const db = await createTestDb();
    const [u] = await db.insert(users).values({ username: 'tekrar', passwordHash: 'x' }).returning();
    const ids = await seed(db, ['2026-08-20']);
    await complete(db, u.id, ids['2026-08-20'].easy, 60_000);
    await complete(db, u.id, ids['2026-08-20'].easy, 55_000); // arşiv tekrarı
    await complete(db, u.id, ids['2026-08-20'].hard, 90_000);

    const [day] = await getCalendarDays(db, {
      from: '2026-08-01', to: '2026-08-31', userId: u.id, now: NOW,
    });
    expect(day).toMatchObject({ puzzleCount: 3, doneCount: 2 });
  });

  it('misafirde tamamlanma sayısı her zaman sıfırdır', async () => {
    const db = await createTestDb();
    const [u] = await db.insert(users).values({ username: 'baskasi', passwordHash: 'x' }).returning();
    const ids = await seed(db, ['2026-08-20']);
    await complete(db, u.id, ids['2026-08-20'].easy, 60_000);

    const [day] = await getCalendarDays(db, { from: '2026-08-01', to: '2026-08-31', now: NOW });
    expect(day).toMatchObject({ puzzleCount: 3, doneCount: 0 });
  });

  it('yayınlanmamış günleri asla döndürmez', async () => {
    const db = await createTestDb();
    await seed(db, [TODAY, addDays(TODAY, 1), addDays(TODAY, 5)]);
    const days = await getCalendarDays(db, {
      from: '2026-08-01', to: '2026-09-30', now: NOW,
    });
    expect(days.map((d) => d.date)).toEqual([TODAY]);
  });

  it('maxDate pencereyi daraltır ama bugünün ötesine genişletemez', async () => {
    const db = await createTestDb();
    await seed(db, [addDays(TODAY, -1), TODAY]);
    const dun = await getCalendarDays(db, {
      from: '2026-08-01', to: '2026-09-30', maxDate: addDays(TODAY, -1), now: NOW,
    });
    expect(dun.map((d) => d.date)).toEqual([addDays(TODAY, -1)]);

    const gelecek = await getCalendarDays(db, {
      from: '2026-08-01', to: '2026-09-30', maxDate: addDays(TODAY, 10), now: NOW,
    });
    expect(gelecek.map((d) => d.date)).toEqual([addDays(TODAY, -1), TODAY]);
  });

  it('lansman öncesine inmez ve boş pencerede boş döner', async () => {
    const db = await createTestDb();
    await seed(db, ['2026-08-20']);
    expect(await getCalendarDays(db, { from: '2026-01-01', to: '2026-01-31', now: NOW })).toEqual([]);
  });
});

describe('archivePageOf', () => {
  it('günü, yeniden eskiye sayfalamada doğru sayfaya eşler', async () => {
    const db = await createTestDb();
    const dates = Array.from({ length: 7 }, (_, i) => addDays(TODAY, -(i + 1))).reverse();
    await seed(db, dates);
    const newest = dates[dates.length - 1];
    const oldest = dates[0];
    // Sayfa başına 3: en yeni gün 1. sayfada, en eski 7 günün sonuncusu 3. sayfada.
    expect(await archivePageOf(db, { date: newest, pageSize: 3, now: NOW })).toBe(1);
    expect(await archivePageOf(db, { date: oldest, pageSize: 3, now: NOW })).toBe(3);
  });
});
