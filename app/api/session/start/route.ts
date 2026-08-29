import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { sessionErrorResponse } from '@/lib/game/http';
import { getIdentity } from '@/lib/game/identity';
import { startSession } from '@/lib/game/session';

const bodySchema = z.object({ puzzleId: z.number().int().positive(), replay: z.boolean().optional() });

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  try {
    const identity = await getIdentity();
    // Sayfa seviyesindeki üyelik kapısını atlayıp API'ye doğrudan istek atan bir
    // misafiri de reddet: aksi halde misafir → üye geçişiyle aynı bulmacayı
    // "temiz" bir kimlikle tekrar oynama açığı (bkz. play/page.tsx) API'den
    // hâlâ mümkün olurdu.
    if (identity.userId === null) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Oynamak için giriş yapmalısın.' },
        { status: 401 },
      );
    }
    const result = await startSession(getDb(), { ...parsed.data, identity });
    return NextResponse.json(result);
  } catch (err) {
    // Eskiden TÜM oturum hataları 404'e çevriliyordu: sahiplik ihlali de,
    // "oturum aktif değil" de aynı yanıtı veriyordu.
    const res = sessionErrorResponse(err);
    if (res) return res;
    throw err;
  }
}
