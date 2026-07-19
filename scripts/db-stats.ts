import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { puzzles } from '@/lib/schema';

async function main(): Promise<void> {
  const db = getDb();
  const [total] = await db.select({ n: sql<number>`count(*)` }).from(puzzles);
  const range = await db.select({ min: sql<string>`min(${puzzles.date})`, max: sql<string>`max(${puzzles.date})` }).from(puzzles);
  console.log(`bulmaca sayısı: ${total.n} · aralık: ${range[0].min} → ${range[0].max}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
