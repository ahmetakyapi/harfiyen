// GELECEKTEKİ bulmacaları yeni üreteç ayarlarıyla yeniden üretir.
//
// Neden ayrı bir script: `generate:puzzles` bulmacası olan tarihleri atlar
// (assignPuzzles → skipped), bu yüzden zaten üretilmiş günler eski ayarda
// kalır. `wipe-puzzles` ise tabloyu WHERE'siz siler ve play_sessions üzerinde
// ON DELETE CASCADE olduğundan TÜM oyun geçmişini, sıralamaları ve serileri
// yok eder — asla toplu kullanılmamalı.
//
// Buradaki kurallar:
//   • Bugün ve geçmiş ASLA silinmez (oynanmış olabilir, arşive girmiştir).
//   • Gelecekte olsa bile OYNANMIŞ bir bulmaca (herhangi bir play_sessions
//     satırı varsa) silinmez.
//   • --confirm verilmeden hiçbir şey silinmez; yalnızca plan yazdırılır.
//
// Kullanım:
//   npx tsx --env-file=.env.local scripts/regenerate-future.ts            (kuru çalışma)
//   npx tsx --env-file=.env.local scripts/regenerate-future.ts --confirm --days 60
import { gt, inArray, sql } from 'drizzle-orm';
import { loadBank } from '@/lib/content';
import { addDays, gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { assignPuzzles } from '@/lib/generator/assign';
import { playSessions, puzzles } from '@/lib/schema';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const confirm = argv.includes('--confirm');
  const daysIdx = argv.indexOf('--days');
  const days = daysIdx === -1 ? 60 : Number(argv[daysIdx + 1] ?? '60');
  if (!Number.isFinite(days) || days < 1) throw new Error('--days pozitif bir sayı olmalı');

  const db = getDb();
  const today = gameDay();

  const future = await db.select({ id: puzzles.id, date: puzzles.date })
    .from(puzzles).where(gt(puzzles.date, today));

  // Gelecekte olup OYNANMIŞ bulmacalar korunur (silinirse oturumları da gider).
  const playedIds = new Set<number>();
  if (future.length > 0) {
    const rows = await db.select({ puzzleId: playSessions.puzzleId })
      .from(playSessions).where(inArray(playSessions.puzzleId, future.map((f) => f.id)));
    for (const r of rows) playedIds.add(r.puzzleId);
  }
  const deletable = future.filter((f) => !playedIds.has(f.id));
  const kept = future.length - deletable.length;

  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(puzzles);
  const dates = [...new Set(deletable.map((d) => d.date))].sort();

  console.log(`Oyun günü        : ${today}`);
  console.log(`Toplam bulmaca   : ${total}`);
  console.log(`Gelecek bulmaca  : ${future.length}`);
  console.log(`Silinecek        : ${deletable.length}${dates.length ? ` (${dates[0]} → ${dates[dates.length - 1]})` : ''}`);
  console.log(`Korunacak (oynanmış): ${kept}`);
  console.log(`Yeniden üretilecek  : ${addDays(today, 1)} tarihinden itibaren ${days} gün`);

  if (!confirm) {
    console.log('\nKuru çalışma — hiçbir şey değişmedi. Uygulamak için --confirm ekle.');
    return;
  }

  if (deletable.length > 0) {
    await db.delete(puzzles).where(inArray(puzzles.id, deletable.map((d) => d.id)));
    console.log(`\n${deletable.length} bulmaca silindi.`);
  }
  const result = await assignPuzzles(db, {
    bank: loadBank(), startDate: addDays(today, 1), days,
  });
  console.log(`Üretim bitti: ${result.created} üretildi, ${result.skipped} atlandı.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
