import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { ensureIdentity } from '@/lib/game/identity';
import { SessionError, startSession } from '@/lib/game/session';

const bodySchema = z.object({ puzzleId: z.number().int().positive(), replay: z.boolean().optional() });

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  try {
    const identity = await ensureIdentity();
    const result = await startSession(getDb(), { ...parsed.data, identity });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SessionError) return NextResponse.json({ error: err.code }, { status: 404 });
    throw err;
  }
}
