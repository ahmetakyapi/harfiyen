import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';

/**
 * TEHLİKELİ: bütün bulmacaları siler. play_sessions üzerinde ON DELETE CASCADE
 * olduğu için TÜM oyun geçmişi, sıralamalar ve (dayanaksız kalan) seriler de
 * gider. Bu yüzden varsayılan davranış KURU ÇALIŞMA: ne silineceğini yazar,
 * hiçbir şeye dokunmaz. Gerçekten silmek için iki bayrak birden gerekir.
 *
 *   npx tsx --env-file=.env.local scripts/wipe-puzzles.ts               # kuru
 *   npx tsx ... scripts/wipe-puzzles.ts --confirm --i-know-what-i-am-doing
 *
 * Gelecek bulmacaları yeniden üretmek için bunu DEĞİL,
 * scripts/regenerate-future.ts'i kullan — o yalnızca oynanmamış günlere dokunur.
 */
async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const db = getDb();
  const [{ puzzleCount }] = await db.select({ puzzleCount: sql<number>`count(*)` }).from(puzzles);
  const [{ sessionCount }] = await db.select({ sessionCount: sql<number>`count(*)` }).from(playSessions);

  console.log(`silinecek: ${puzzleCount} bulmaca, ${sessionCount} oyun oturumu (cascade)`);
  if (!args.has('--confirm') || !args.has('--i-know-what-i-am-doing')) {
    console.log('kuru çalışma — hiçbir şey silinmedi.');
    console.log('gerçekten silmek için: --confirm --i-know-what-i-am-doing');
    return;
  }
  await db.delete(puzzles);
  console.log('silindi.');
}

main().catch((err) => { console.error(err); process.exit(1); });
