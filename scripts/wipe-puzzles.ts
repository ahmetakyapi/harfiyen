import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { puzzles } from '@/lib/schema';

async function main(): Promise<void> {
  const db = getDb();
  await db.delete(puzzles);
  const [after] = await db.select({ n: sql<number>`count(*)` }).from(puzzles);
  console.log(`puzzles tablosu temizlendi. kalan satır: ${after.n}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
