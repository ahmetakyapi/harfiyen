import { desc } from 'drizzle-orm';
import { loadBank } from '@/lib/content';
import { addDays, gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { assignPuzzles } from '@/lib/generator/assign';
import { puzzles } from '@/lib/schema';

async function main(): Promise<void> {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i += 2) {
    args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1] ?? '');
  }
  const days = Number(args.get('days') ?? '30');
  const baseSeed = args.has('seed') ? Number(args.get('seed')) : undefined;
  const db = getDb();
  const [latest] = await db.select({ date: puzzles.date }).from(puzzles)
    .orderBy(desc(puzzles.date)).limit(1);
  const startDate = args.get('start') ?? (latest ? addDays(latest.date, 1) : gameDay());
  console.log(`Üretim: ${startDate} tarihinden itibaren ${days} gün...`);
  const result = await assignPuzzles(db, { bank: loadBank(), startDate, days, baseSeed });
  console.log(`Bitti: ${result.created} üretildi, ${result.skipped} atlandı.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
