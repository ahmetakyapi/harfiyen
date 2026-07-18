import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUserId } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getLeaderboard } from '@/lib/game/leaderboard';

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  const board = await getLeaderboard(getDb(), {
    date: parsed.data.date, difficulty: parsed.data.difficulty, userId: await currentUserId(),
  });
  if (!board) return NextResponse.json({ error: 'Bulmaca bulunamadı.' }, { status: 404 });
  return NextResponse.json(board);
}
