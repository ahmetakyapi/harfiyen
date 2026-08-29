import { NextResponse } from 'next/server';
import { desc, gte, sql } from 'drizzle-orm';
import { loadBank } from '@/lib/content';
import { addDays, gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { assignPuzzles } from '@/lib/generator/assign';
import { puzzles } from '@/lib/schema';

export const dynamic = 'force-dynamic';
// Üretim bir günde 3 bulmaca × N gün; Vercel'in varsayılan 10 sn'lik sınırı yetmez.
export const maxDuration = 300;

// Havuz bu eşiğin altına inince üretim tetiklenir. Bir haftalık cron aralığında
// bile geniş bir emniyet payı bırakır.
const MIN_DAYS_AHEAD = 30;
// Tek koşuda üretilecek gün sayısı (3 bulmaca/gün). Ölçüm: kelime tekrar
// penceresi altında bulmaca başına ~2,5 sn (npx tsx scripts/generator-stats.ts
// ve 30 günlük simülasyon). 21 gün ≈ 160 sn — maxDuration'ın altında kalır.
const GENERATE_DAYS = 21;

/**
 * Bulmaca havuzu tükenirse site sessizce boşalır ve — daha kötüsü — o gün
 * HERKESİN serisi kırılır (lib/game/streak.ts), bu geri alınamaz bir hasardır.
 * Üretim eskiden tamamen elle yapılıyordu ("ayda bir çalıştır", README).
 *
 * Vercel Cron bu ucu haftalık çağırır ve `Authorization: Bearer $CRON_SECRET`
 * taşır. Elle de tetiklenebilir (aynı başlıkla).
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET tanımlı değil.' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  const db = getDb();
  const today = gameDay();
  const [[{ daysAhead }], [latest]] = await Promise.all([
    db.select({ daysAhead: sql<number>`count(distinct ${puzzles.date})` })
      .from(puzzles).where(gte(puzzles.date, today)),
    db.select({ date: puzzles.date }).from(puzzles).orderBy(desc(puzzles.date)).limit(1),
  ]);

  const ahead = Number(daysAhead);
  if (ahead >= MIN_DAYS_AHEAD) {
    return NextResponse.json({ ok: true, skipped: true, daysAhead: ahead });
  }

  const startDate = latest ? addDays(latest.date, 1) : today;
  const result = await assignPuzzles(db, {
    bank: loadBank(), startDate, days: GENERATE_DAYS,
  });
  console.warn(`[harfiyen] cron üretim: ${startDate} → ${result.created} bulmaca (havuz ${ahead} gündü)`);
  return NextResponse.json({ ok: true, startDate, daysAhead: ahead, ...result });
}
