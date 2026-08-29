import { gte, sql } from 'drizzle-orm';
import { gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';

// Havuz sağlığı ve temel oyun sayıları. En kritik satır "kalan gün": sıfıra
// inerse site boşalır ve o gün herkesin serisi kırılır.
async function main(): Promise<void> {
  const db = getDb();
  const today = gameDay();
  const [[total], [range], [ahead], [userCount], [sessionCount]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(puzzles),
    db.select({
      min: sql<string>`min(${puzzles.date})`, max: sql<string>`max(${puzzles.date})`,
    }).from(puzzles),
    db.select({ n: sql<number>`count(distinct ${puzzles.date})` })
      .from(puzzles).where(gte(puzzles.date, today)),
    db.select({ n: sql<number>`count(*)` }).from(users),
    db.select({ n: sql<number>`count(*)` }).from(playSessions),
  ]);
  console.log(`bulmaca      : ${total.n} · aralık ${range.min} → ${range.max}`);
  console.log(`kalan gün    : ${ahead.n}  ${Number(ahead.n) < 30 ? '⚠️  30 günün altında — üretim çalıştır' : ''}`);
  console.log(`kullanıcı    : ${userCount.n}`);
  console.log(`oturum       : ${sessionCount.n}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
