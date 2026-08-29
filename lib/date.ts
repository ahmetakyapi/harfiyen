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
