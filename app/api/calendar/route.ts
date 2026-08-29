import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUserId } from '@/lib/auth';
import { CALENDAR_GRID_CELLS, isValidGameDate } from '@/lib/date';
import { getDb } from '@/lib/db';
import { getCalendarDays } from '@/lib/game/calendar';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  from: z.string().refine(isValidGameDate, 'geçersiz tarih'),
  to: z.string().refine(isValidGameDate, 'geçersiz tarih'),
});

// Bir ay ızgarası 42 hücre; biraz pay bırakıp tavan koyuyoruz ki bu uç
// "bütün geçmişi tek istekte ver" kanalına dönüşmesin.
const MAX_WINDOW_DAYS = CALENDAR_GRID_CELLS + 7;

/**
 * Tarih seçicinin işaret verisi: pencere içindeki her gün için "kaç bulmaca
 * yayınlandı" ve "oyuncu kaçını bitirdi".
 *
 * Yayınlanmamış günler getCalendarDays içinde kırpılır — bu uç gelecek bir
 * bulmacanın VARLIĞINI bile doğrulamaz.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const { from, to } = parsed.data;
  if (from > to) return NextResponse.json({ days: [] });
  const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (span > MAX_WINDOW_DAYS) {
    return NextResponse.json({ error: 'Aralık çok geniş.' }, { status: 400 });
  }

  const days = await getCalendarDays(getDb(), { from, to, userId: await currentUserId() });
  return NextResponse.json({ days });
}
