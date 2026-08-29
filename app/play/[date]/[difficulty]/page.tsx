import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { GameBoard } from '@/components/game/GameBoard';
import { auth } from '@/lib/auth';
import { formatTrtDate, gameDay, isValidGameDate, puzzleNumber } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { getClientPuzzle } from '@/lib/game/puzzle';
import { playSessions, puzzles } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Params = { date: string; difficulty: string };

function parseParams(params: Params): { date: string; difficulty: Difficulty } | null {
  if (!isValidGameDate(params.date)) return null;
  if (!(DIFFICULTIES as readonly string[]).includes(params.difficulty)) return null;
  if (params.date > gameDay()) return null; // gelecek bulmacalar sızmaz
  return { date: params.date, difficulty: params.difficulty as Difficulty };
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const parsed = parseParams(params);
  if (!parsed) return { title: 'Bulmaca' };
  return {
    title: `${DIFFICULTY_LABELS[parsed.difficulty]} · ${formatTrtDate(parsed.date)}`,
  };
}

export default async function PlayPage({ params }: { params: Params }) {
  const parsed = parseParams(params);
  if (!parsed) notFound();
  const { date, difficulty } = parsed;
  const today = gameDay();

  const session = await auth();
  // Oynamak için üyelik şart: misafir bir bulmacayı oynayıp cevapları görüp
  // sonra üye olup "temiz" bir oturumla aynı bulmacayı tekrar oynayabilirdi
  // (misafir kimliği ile üye kimliği farklı identity'ler olduğundan, üyelik
  // sonrası oturum sistemde "ilk deneme" sayılır) — bu, süre bazlı sıralamayı
  // anlamsızlaştıran bir açıktı. Oyun ekranına girişi tamamen üyelere kısıtlamak
  // bu açığı kökten kapatır.
  if (!session) redirect(`/login?next=/play/${date}/${difficulty}`);
  const userId = Number(session.user.id);

  // Cevap sızıntısına karşı tek kapı: kolon listesi lib/game/puzzle.ts'te
  // tanımlı ve lib/game/puzzle.test.ts ile teste bağlı.
  const db = getDb();
  const puzzle = await getClientPuzzle(db, date, difficulty);
  if (!puzzle) notFound();

  // Üçü de tek turda, PARALEL:
  //  · bu bulmacadaki kendi oturumlarım (bitmiş mi, yarım kalmış mı),
  //  · aynı günün diğer iki zorluğunun durumu (bitiş ekranındaki geçiş
  //    düğmeleri "bitti / bekliyor" ayrımını gösterebilsin diye).
  const [mine, siblingRows] = await Promise.all([
    db.select({
      status: playSessions.status, startedAt: playSessions.startedAt,
      durationMs: playSessions.durationMs,
    }).from(playSessions).where(and(
      eq(playSessions.puzzleId, puzzle.id), eq(playSessions.userId, userId),
    )),
    db.select({ difficulty: puzzles.difficulty, durationMs: playSessions.durationMs })
      .from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(and(
        eq(playSessions.userId, userId),
        eq(playSessions.status, 'completed'),
        eq(puzzles.date, date),
        inArray(puzzles.difficulty, [...DIFFICULTIES]),
      )),
  ]);

  const completed = mine.find((s) => s.status === 'completed');
  const active = mine.find((s) => s.status === 'active');
  const siblings: Partial<Record<Difficulty, number | null>> = {};
  for (const s of siblingRows) {
    const prev = siblings[s.difficulty];
    // Arşivde aynı bulmaca birden çok kez çözülebilir; en iyi süre gösterilir.
    siblings[s.difficulty] = prev == null || (s.durationMs ?? 0) < prev ? s.durationMs : prev;
  }

  return (
    <>
      {/* Geri tuşuyla dönüşte bayat "Başla" görünmesin — refresh istemci
          state'ini korur, süren oyunu etkilemez. */}
      <AutoRefresh />
      <GameBoard puzzle={puzzle} puzzleNumber={puzzleNumber(date)} isArchive={date < today}
        alreadyCompleted={completed !== undefined}
        completedMs={completed?.durationMs ?? null}
        activeStartedAt={active?.startedAt.toISOString() ?? null}
        siblings={siblings} />
    </>
  );
}
