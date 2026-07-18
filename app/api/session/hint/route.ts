import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { sessionErrorResponse } from '@/lib/game/http';
import { getIdentity } from '@/lib/game/identity';
import { useHint } from '@/lib/game/session';

const bodySchema = z.object({
  sessionId: z.number().int().positive(),
  row: z.number().int().min(0), col: z.number().int().min(0),
});

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  try {
    const identity = await getIdentity();
    const result = await useHint(getDb(), { ...parsed.data, identity });
    return NextResponse.json(result);
  } catch (err) {
    const res = sessionErrorResponse(err);
    if (res) return res;
    throw err;
  }
}
