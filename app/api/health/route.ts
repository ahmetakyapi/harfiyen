import { NextResponse } from 'next/server';
import { gte, sql } from 'drizzle-orm';
import { gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { puzzles } from '@/lib/schema';

// force-dynamic ŞART: bu uç eskiden build sırasında bir kez çalışıp yanıtı
// donduruyordu — yani "sağlık" bilgisi dağıtım anındaki kopyaydı.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getDb();
    const today = gameDay();
    const [{ daysAhead }] = await db
      .select({ daysAhead: sql<number>`count(distinct ${puzzles.date})` })
      .from(puzzles).where(gte(puzzles.date, today));
    return NextResponse.json({
      ok: true,
      // Havuzda kaç günlük bulmaca kaldı: sıfıra inerse site boşalır ve
      // herkesin serisi kırılır. İzlemenin tek göstergesi budur.
      daysAhead: Number(daysAhead),
      today,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
