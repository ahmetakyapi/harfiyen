import { and, between, eq, gt, lt, sql } from 'drizzle-orm';
import { LAUNCH_DATE, gameDay } from '@/lib/date';
import type { Db } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';

export type CalendarDay = {
  date: string;
  /** O gün YAYINLANMIŞ farklı zorluk sayısı (normalde 3). 0 ise gün boş. */
  puzzleCount: number;
  /** Oyuncunun BİTİRDİĞİ farklı zorluk sayısı (0-3). Misafirde her zaman 0. */
  doneCount: number;
};

/**
 * Takvim penceresi için gün gün "bulmaca var mı / kaç zorluk bitti".
 *
 * Granülerlik AY değil PENCERE: takvim ızgarası pazartesiden başlayıp komşu
 * ayların günlerini de gösterir, o hücrelerin de işareti gerekir. Tüm aralığı
 * (lansmandan bugüne) tek seferde çekmek bilinçli olarak reddedildi — her gün
 * bir satır büyür ve arşivde aynı hata bir kez düzeltildi.
 */
export async function getCalendarDays(db: Db, opts: {
  from: string; to: string; userId?: number | null; now?: Date;
  /** Pencereyi DARALTIR (arşiv dünle biter). Bugünü asla genişletemez. */
  maxDate?: string;
}): Promise<CalendarDay[]> {
  const today = gameDay(opts.now);
  const ceiling = opts.maxDate && opts.maxDate < today ? opts.maxDate : today;
  const from = opts.from < LAUNCH_DATE ? LAUNCH_DATE : opts.from;
  const to = opts.to > ceiling ? ceiling : opts.to;
  if (from > to) return [];

  const rows = await db
    .select({
      date: puzzles.date,
      // count(*) DEĞİL: gün başına 3 satır var ve üretim yarıda kalırsa
      // 1-2 satırlık gün oluşabilir — "her gün 3" varsayımı doğru değil.
      puzzleCount: sql<number>`count(distinct ${puzzles.difficulty})`,
      // Arşivde aynı bulmaca TEKRAR oynanabiliyor; count(*) filter kullanılsaydı
      // iki kez bitirilen "kolay" 2 sayılır ve gün 4/3 görünürdü.
      doneCount: sql<number>`count(distinct ${puzzles.difficulty})
        filter (where ${playSessions.id} is not null)`,
    })
    .from(puzzles)
    // DİKKAT: kullanıcı/durum koşulları ON'da durur, WHERE'de DEĞİL. WHERE'e
    // taşınırsa LEFT JOIN fiilen INNER JOIN'e döner ve oyuncunun hiç oynamadığı
    // günler takvimden TAMAMEN kaybolur (lib/game/calendar.test.ts bunu korur).
    .leftJoin(playSessions, and(
      eq(playSessions.puzzleId, puzzles.id),
      // Misafirde -1: hiçbir satır eşleşmez, doneCount 0 kalır, tek kod yolu.
      eq(playSessions.userId, opts.userId ?? -1),
      eq(playSessions.status, 'completed'),
    ))
    .where(between(puzzles.date, from, to))
    .groupBy(puzzles.date)
    .orderBy(puzzles.date);

  // count() bigint döner; sürücü string olarak taşır.
  return rows.map((r) => ({
    date: r.date,
    puzzleCount: Number(r.puzzleCount),
    doneCount: Number(r.doneCount),
  }));
}

/**
 * Takvim hücresinin durumu. Sıra ÖNEMLİ: komşu ay en başta elenir, çünkü o
 * hücreler yalnızca yön bulmak için oradadır — işaret taşımamalıdırlar.
 * (Taşıdıklarında, gri alanın içinde yeşil "oynadın" kareleri beliriyor ve
 * takvim "temmuzun son iki gününü oynadım, temmuzun geri kalanını değil" gibi
 * yanlış bir şey söylüyordu.)
 */
export type CalendarCellState =
  | 'ay-disi'
  | 'yayinlanmadi'
  | 'yok'
  | 'oynanmamis'
  | 'oynanmis';

export function cellStateOf(opts: {
  date: string;
  /** Panelde görünen ay ('YYYY-MM'). */
  month: string;
  /** Oyun günü — bundan sonrası henüz yayınlanmadı. */
  today: string;
  day?: { puzzleCount: number; doneCount: number };
}): CalendarCellState {
  if (opts.date.slice(0, 7) !== opts.month) return 'ay-disi';
  if (opts.date > opts.today) return 'yayinlanmadi';
  if (opts.date < LAUNCH_DATE) return 'yok';
  const day = opts.day;
  if (!day || day.puzzleCount === 0) return 'yok';
  return day.doneCount > 0 ? 'oynanmis' : 'oynanmamis';
}

/**
 * Arşivdeki sayfalama, günleri YENİDEN ESKİYE 12'şer diziyor. Bir günün hangi
 * sayfada olduğu, kendisinden daha yeni gün sayısından çıkar.
 */
export async function archivePageOf(db: Db, opts: {
  date: string; pageSize: number; now?: Date;
}): Promise<number> {
  const today = gameDay(opts.now);
  const inner = db.selectDistinct({ date: puzzles.date }).from(puzzles)
    .where(and(gt(puzzles.date, opts.date), lt(puzzles.date, today)))
    .as('newer');
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(inner);
  return Math.floor(Number(row?.n ?? 0) / opts.pageSize) + 1;
}
