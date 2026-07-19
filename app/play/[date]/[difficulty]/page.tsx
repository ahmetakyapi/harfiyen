import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { GameBoard } from '@/components/game/GameBoard';
import { auth } from '@/lib/auth';
import { gameDay, puzzleNumber } from '@/lib/date';
import { getDb } from '@/lib/db';
import { puzzles } from '@/lib/schema';
import { DIFFICULTIES, type ClientPuzzle, type Difficulty, type Entry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PlayPage({ params }: {
  params: { date: string; difficulty: string };
}) {
  const { date, difficulty } = params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) notFound();
  const today = gameDay();
  if (date > today) notFound(); // gelecek bulmacalar sızmaz

  // DİKKAT: solution ve words kolonları ASLA seçilmez
  const [row] = await getDb().select({
    id: puzzles.id, publicId: puzzles.publicId, date: puzzles.date,
    difficulty: puzzles.difficulty, size: puzzles.size,
    black: puzzles.black, entries: puzzles.entries, wordHashes: puzzles.wordHashes,
  }).from(puzzles).where(and(eq(puzzles.date, date), eq(puzzles.difficulty, difficulty as Difficulty)));
  if (!row) notFound();

  const puzzle: ClientPuzzle = {
    id: row.id, publicId: row.publicId, date: row.date, difficulty: row.difficulty,
    size: row.size, black: row.black as boolean[][], entries: row.entries as Entry[],
    wordHashes: row.wordHashes as Record<string, string>,
  };
  const session = await auth();
  return (
    <GameBoard puzzle={puzzle} puzzleNumber={puzzleNumber(date)}
      isGuest={!session} isArchive={date < today} />
  );
}
