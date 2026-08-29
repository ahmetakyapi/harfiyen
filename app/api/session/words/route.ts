import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { sessionErrorResponse } from '@/lib/game/http';
import { getIdentity } from '@/lib/game/identity';
import { getSessionWords } from '@/lib/game/session';

const bodySchema = z.object({ sessionId: z.number().int().positive() });

// Bitiş ekranındaki "Bugünün Kelimeleri" dökümü. Cevaplar YALNIZCA oyuncunun
// kendi TAMAMLANMIŞ oturumu için döner (sahiplik + durum kontrolü
// getSessionWords içinde); yarım kalmış oturumda 409 ile reddedilir.
export async function POST(req: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  try {
    const identity = await getIdentity();
    const words = await getSessionWords(getDb(), { ...parsed.data, identity });
    return NextResponse.json({ words });
  } catch (err) {
    const res = sessionErrorResponse(err);
    if (res) return res;
    throw err;
  }
}
