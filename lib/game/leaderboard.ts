import { and, asc, eq, lte, or, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import type { Difficulty } from '@/lib/types';

export type LeaderboardRow = { rank: number; username: string; durationMs: number; hintCount: number };

// Listede gösterilen sıra sayısı. Bu eşiğin altındakiler "top", üstündeki
// oyuncunun kendi sırası ayrı bir satır olarak gösterilir.
const TOP_LIMIT = 100;

export async function getLeaderboard(db: Db, opts: {
  date: string; difficulty: Difficulty; userId?: number | null;
}): Promise<{
  // puzzleId çağıran tarafa döner: sıralama sayfası, oyuncunun bu bulmacayı
  // bitirip bitirmediğine bakıp "Oyna" çağrısı gösteriyor.
  puzzleId: number; top: LeaderboardRow[];
  me: { rank: number; durationMs: number } | null; total: number;
  // Oyuncunun bu bulmacayı bitirip bitirmediği — sıralamaya GİRMEYEN (arşiv)
  // oturumlar dahil. `me`den farkı bu: `me` yalnızca sıralı oturumu gösterir.
  meCompleted: boolean;
} | null> {
  const [puzzle] = await db.select({ id: puzzles.id }).from(puzzles)
    .where(and(eq(puzzles.date, opts.date), eq(puzzles.difficulty, opts.difficulty)));
  if (!puzzle) return null;

  const userId = opts.userId ?? null;
  const completedRanked = and(
    eq(playSessions.puzzleId, puzzle.id),
    eq(playSessions.isRanked, true),
    eq(playSessions.status, 'completed'),
  );

  // Sıra numarası ve toplam sayı SQL'de pencere fonksiyonlarıyla hesaplanır.
  // Eskiden 1000 satır JOIN'lenip Node'a çekiliyor, sıra `findIndex` ile
  // aranıyor ve toplam için AYRI bir COUNT sorgusu atılıyordu: 1000. oyuncudan
  // sonrakiler zaten yanlış sıra görüyordu ve her sayfa görüntülemesi
  // gereksiz yere kilobaytlarca satır taşıyordu. Artık en çok 101 satır döner
  // (ilk 100 + kendi satırın) ve sıra sınırsız derinlikte doğrudur.
  const ranked = db.$with('ranked').as(
    db.select({
      userId: playSessions.userId,
      username: users.username,
      durationMs: playSessions.durationMs,
      hintCount: playSessions.hintCount,
      rank: sql<number>`row_number() over (
        order by ${playSessions.durationMs} asc, ${playSessions.submittedAt} asc
      )`.as('rank'),
      total: sql<number>`count(*) over ()`.as('total'),
    }).from(playSessions)
      .innerJoin(users, eq(users.id, playSessions.userId))
      .where(completedRanked),
  );

  // İki sorgu paralel: ikisi de yalnızca puzzle.id'ye bağlı, birbirini
  // beklemelerinin sebebi yok. Sayfanın sunucu gecikmesi tek tura iner.
  const [rows, mine] = await Promise.all([
    db.with(ranked).select().from(ranked)
      .where(userId !== null
        ? or(lte(ranked.rank, TOP_LIMIT), eq(ranked.userId, userId))
        : lte(ranked.rank, TOP_LIMIT))
      .orderBy(asc(ranked.rank)),
    userId !== null
      ? db.select({ id: playSessions.id }).from(playSessions).where(and(
          eq(playSessions.puzzleId, puzzle.id),
          eq(playSessions.userId, userId),
          eq(playSessions.status, 'completed'),
        )).limit(1)
      : Promise.resolve([]),
  ]);

  // row_number()/count() bigint döner; sürücü bunları string olarak taşır.
  const top: LeaderboardRow[] = [];
  let me: { rank: number; durationMs: number } | null = null;
  for (const r of rows) {
    const rank = Number(r.rank);
    if (rank <= TOP_LIMIT) {
      top.push({ rank, username: r.username, durationMs: r.durationMs ?? 0, hintCount: r.hintCount });
    }
    if (userId !== null && r.userId === userId) me = { rank, durationMs: r.durationMs ?? 0 };
  }

  return {
    puzzleId: puzzle.id, top, me,
    total: rows.length > 0 ? Number(rows[0].total) : 0,
    meCompleted: mine.length > 0,
  };
}
