import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { ArchiveGallery } from '@/components/archive/ArchiveGallery';
import { gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';

export const metadata = { title: 'Arşiv' };
export const dynamic = 'force-dynamic';

// Sayfa başına gün: 3 sütunlu ızgarada tam 4 sıra, 2 sütunda 6 sıra.
const PAGE_SIZE = 12;

export default async function ArchivePage({ searchParams }: {
  searchParams: { sayfa?: string };
}) {
  const db = getDb();
  const today = gameDay();
  const page = Math.max(1, Number.parseInt(searchParams.sayfa ?? '1', 10) || 1);

  // Sayfalama SQL'de: eskiden tüm geçmiş günler tek seferde çekiliyordu; arşiv
  // her gün bir satır büyüdüğünden hem sorgu hem DOM sınırsız şişerdi.
  const [{ total }] = await db
    .select({ total: sql<number>`count(distinct ${puzzles.date})` })
    .from(puzzles).where(lt(puzzles.date, today));
  const totalDays = Number(total);
  const pageCount = Math.max(1, Math.ceil(totalDays / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const dateRows = await db.selectDistinct({ date: puzzles.date })
    .from(puzzles).where(lt(puzzles.date, today))
    .orderBy(desc(puzzles.date))
    .limit(PAGE_SIZE).offset((safePage - 1) * PAGE_SIZE);
  const dates = dateRows.map((r) => r.date);

  // `${date}:${difficulty}` → tamamlanan oturumun süresi. Yalnızca bu
  // sayfadaki günler sorgulanır.
  const doneMs = new Map<string, number | null>();
  const session = await auth();
  if (session && dates.length > 0) {
    const mine = await db.select({
      date: puzzles.date, difficulty: puzzles.difficulty, durationMs: playSessions.durationMs,
    })
      .from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(and(
        eq(playSessions.userId, Number(session.user.id)),
        eq(playSessions.status, 'completed'),
        inArray(puzzles.date, dates),
      ));
    for (const m of mine) doneMs.set(`${m.date}:${m.difficulty}`, m.durationMs);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AutoRefresh />
      <ArchiveGallery dates={dates} doneMs={doneMs}
        page={safePage} pageCount={pageCount} totalDays={totalDays} />
    </main>
  );
}
