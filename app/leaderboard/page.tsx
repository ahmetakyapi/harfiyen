import Link from 'next/link';
import { Play } from 'lucide-react';
import { auth } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LAUNCH_DATE, addDays, formatTrtDate, formatTrtWeekday, gameDay } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { getLeaderboard } from '@/lib/game/leaderboard';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { DateJump } from '@/components/calendar/DateJump';
import { DifficultyTabs } from '@/components/leaderboard/DifficultyTabs';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { formatDuration } from '@/lib/share';
import { KineticTitle } from '@/components/motion/KineticTitle';

export const metadata = { title: 'Sıralama' };
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }: {
  searchParams: { date?: string; difficulty?: string };
}) {
  const today = gameDay();
  // Tarih iki uçtan da kırpılır: geleceğe bakılamaz (yayınlanmamış bulmaca
  // sızmasın) ve lansmandan öncesine gidilemez (eskiden "önceki gün" oku
  // sonsuza kadar boş günlere götüren bir ölü uçtu).
  const raw = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? '') ? (searchParams.date as string) : today;
  const date = raw > today ? today : raw < LAUNCH_DATE ? LAUNCH_DATE : raw;
  const difficulty = (DIFFICULTIES as readonly string[]).includes(searchParams.difficulty ?? '')
    ? (searchParams.difficulty as Difficulty) : 'easy';
  const session = await auth();
  const userId = session ? Number(session.user.id) : null;
  const board = await getLeaderboard(getDb(), { date, difficulty, userId });

  // Bu bölümü henüz bitirmemiş oyuncuya doğrudan oynama çağrısı gösterilir:
  // sıralamaya bakmanın en doğal devamı "ben de deneyeyim"dir, oysa oyuncu
  // bunun için ana sayfaya geri dönmek zorunda kalıyordu. Üye olmayanda da
  // görünür — /play girişi zorunlu kıldığından bağlantı login'e taşır.
  // Oynanmışlık YALNIZCA tamamlanmışlığa bakar; yarım kalmış oturumda da
  // "devam et" anlamında çağrı görünmeye devam eder. Bu bilgi sıralama
  // sorgusuyla PARALEL çekiliyor (bkz. getLeaderboard) — ayrı bir tur değil.
  const completed = board?.meCompleted ?? false;

  return (
    <main className="page-enter mx-auto max-w-lg px-4 py-8">
      <AutoRefresh />
      <KineticTitle text="Sıralama"
        className="font-display-flourish mb-3 text-center font-display text-[2.5rem] leading-tight tracking-tight sm:text-5xl" />
      {/* Dokunma hedefleri 44 px: oklar eskiden 32 px'lik dairelerdi. */}
      <div className="rise mb-5 flex items-center justify-center gap-2 text-sm" style={{ '--i': 1 } as React.CSSProperties}>
        {date > LAUNCH_DATE
          ? <Link href={`/leaderboard?date=${addDays(date, -1)}&difficulty=${difficulty}`} aria-label="Önceki gün"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">←</Link>
          : <span aria-hidden className="flex h-11 w-11 items-center justify-center opacity-30">←</span>}
        {/* Tarih etiketi artık takvimi açan düğme: geçmişe gitmek günde bir
            tık değil, iki tık. Oklar günlük ince ayar için yerinde kalır. */}
        <DateJump selected={date} today={today}
          hrefPattern={`/leaderboard?date={date}&difficulty=${difficulty}`}
          label={
            <span className="min-w-[9.5rem] text-center">
              <span className="block font-medium leading-tight">{formatTrtDate(date)}</span>
              <span className="block text-xs text-[var(--ink-soft)]">
                {date === today ? 'Bugün' : formatTrtWeekday(date)}
              </span>
            </span>
          } />
        {date < today
          ? <Link href={`/leaderboard?date=${addDays(date, 1)}&difficulty=${difficulty}`} aria-label="Sonraki gün"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">→</Link>
          : <span aria-hidden className="flex h-11 w-11 items-center justify-center opacity-30">→</span>}
      </div>
      <div className="rise" style={{ '--i': 2 } as React.CSSProperties}>
        <DifficultyTabs date={date} difficulty={difficulty} />
      </div>
      {board !== null && !completed && (
        <Link href={`/play/${date}/${difficulty}`}
          className="btn-wipe rise mb-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 font-semibold text-[var(--paper)] shadow-[0_16px_36px_-24px_var(--ink)] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]">
          <Play aria-hidden className="h-4 w-4 fill-current" />
          {DIFFICULTY_LABELS[difficulty]} Bölümünü Oyna
          {date < today && <span className="text-sm font-normal opacity-70">· arşiv</span>}
        </Link>
      )}
      {board === null
        ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-12 text-center">
            <p className="font-display text-xl">Bu Gün İçin Bulmaca Yok</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Yayınlanmamış ya da lansmandan önceki bir gün seçtin.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/leaderboard"
                className="flex min-h-11 items-center justify-center rounded-xl bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper)]">
                Bugünün Sıralaması
              </Link>
              <Link href="/archive"
                className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] px-5 text-sm font-medium">
                Arşive Göz At
              </Link>
            </div>
          </div>
        )
        : (
          <>
            {/* Anahtar gün + zorluk: sekme değişince satırlar yeniden dizilir. */}
            <LeaderboardTable key={`${date}:${difficulty}`} rows={board.top} myUsername={session?.user?.name} isToday={date === today} />
            {board.me && board.me.rank > 100 && (
              <p className="mt-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--row-me)] px-4 py-3 text-center text-sm">
                Senin sıran: <strong>{board.me.rank}.</strong>
                <span className="font-mono tabular-nums"> · {formatDuration(board.me.durationMs)}</span>
              </p>
            )}
            {board.total > 0 && (
              <p className="mt-3 text-center font-mono text-xs tabular-nums text-[var(--ink-soft)]">
                {board.total} oyuncu bitirdi
              </p>
            )}
          </>
        )}
    </main>
  );
}
