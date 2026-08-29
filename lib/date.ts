const TRT = 'Europe/Istanbul';
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export const LAUNCH_DATE = '2026-07-19';
export const RESET_HOUR = 9; // TSİ

export function trtDate(now: Date = new Date()): string {
  // en-CA locale YYYY-MM-DD üretir
  return new Intl.DateTimeFormat('en-CA', { timeZone: TRT }).format(now);
}

// Oyun günü TSİ 09:00'da başlar. İstanbul'da DST yok (sabit UTC+3),
// bu yüzden anı RESET_HOUR kadar geri kaydırıp takvim gününü almak güvenlidir.
export function gameDay(now: Date = new Date()): string {
  return trtDate(new Date(now.getTime() - RESET_HOUR * HOUR_MS));
}

// Biçim DOĞRU ama takvimde OLMAYAN tarihler (2026-02-30, 2026-11-31) eskiden
// doğrudan Postgres'e gidiyor ve "date/time field value out of range" ile 500
// üretiyordu. String karşılaştırması da bunları yakalayamaz: '2026-02-30' >
// bugünden küçük olduğu için /play'in "gelecek" kapısına takılmıyorlardı.
export function isValidGameDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const t = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === date;
}

export function addDays(date: string, n: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + n * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

// Haftanın günü, PAZARTESİ = 0. Takvimlerin tamamı pazartesiden başlar.
// (Kopya app/profile/[username]/page.tsx içinde gömülüydü; tek kaynak burası.)
export function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export const TR_WEEKDAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
export const TR_WEEKDAY_LONG = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar',
] as const;

/** 'YYYY-MM-DD' → 'YYYY-MM' */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** 'YYYY-MM' ± n ay → 'YYYY-MM' */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const mon = total % 12 + 1;
  return `${String(year).padStart(4, '0')}-${String(mon).padStart(2, '0')}`;
}

/**
 * Bir ayın takvim ızgarası: SABİT 42 hücre (6 hafta), pazartesiden başlar.
 * Sabit olması şart — ay değişince panelin boyu zıplamamalı.
 * Dönen dizide komşu ayların taşan günleri de vardır; çağıran hangisinin
 * ay dışı olduğunu `monthOf` ile ayırt eder.
 */
export const CALENDAR_GRID_CELLS = 42;

export function monthGrid(month: string): string[] {
  const first = `${month}-01`;
  const start = addDays(first, -weekdayIndex(first));
  return Array.from({ length: CALENDAR_GRID_CELLS }, (_, i) => addDays(start, i));
}

export function puzzleNumber(date: string): number {
  const diff = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${LAUNCH_DATE}T00:00:00Z`)) / DAY_MS;
  return Math.round(diff) + 1;
}

export function msUntilNextReset(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TRT, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? '0') % 24; // saat 24 → 0
  const sinceMidnight =
    (get('hour') * 3600 + get('minute') * 60 + get('second')) * 1000 + now.getMilliseconds();
  const sinceReset = (sinceMidnight - RESET_HOUR * HOUR_MS + DAY_MS) % DAY_MS;
  return DAY_MS - sinceReset;
}

export function formatTrtDate(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

// "14 Temmuz" (yıl yok) — arşiv kartlarında kompakt başlık için.
export function formatTrtDayMonth(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC', day: 'numeric', month: 'long',
  }).format(new Date(`${date}T00:00:00Z`));
}

// "Temmuz 2026" — arşiv kartlarında ay satırı için.
export function formatTrtMonth(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC', month: 'long', year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

// "28" — arşiv kartındaki büyük display rakamı.
export function formatTrtDayNumber(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC', day: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));
}

// "Pazartesi" — arşiv kartlarında gün adı için.
export function formatTrtWeekday(date: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC', weekday: 'long',
  }).format(new Date(`${date}T00:00:00Z`));
}
