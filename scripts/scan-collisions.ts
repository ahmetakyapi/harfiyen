import { getDb } from '@/lib/db';
import { puzzles } from '@/lib/schema';
import type { Entry } from '@/lib/types';

async function main(): Promise<void> {
  const db = getDb();
  const rows = await db.select({
    id: puzzles.id, date: puzzles.date, difficulty: puzzles.difficulty, entries: puzzles.entries,
  }).from(puzzles);
  const affected: { id: number; date: string; difficulty: string; dupKeys: string[] }[] = [];
  for (const row of rows) {
    const entries = row.entries as Entry[];
    const seen = new Map<string, number>();
    for (const e of entries) {
      const key = `${e.row}:${e.col}:${e.dir}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const dupKeys = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    if (dupKeys.length > 0) {
      affected.push({ id: row.id, date: row.date, difficulty: row.difficulty, dupKeys });
    }
  }
  console.log(`toplam bulmaca: ${rows.length}`);
  console.log(`etkilenen (çakışan başlangıçlı) bulmaca: ${affected.length}`);
  for (const a of affected) {
    console.log(`  id=${a.id} ${a.date} ${a.difficulty} → ${a.dupKeys.join(', ')}`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
