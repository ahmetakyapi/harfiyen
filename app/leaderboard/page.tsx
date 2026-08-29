import Link from 'next/link';
import { Play } from 'lucide-react';
import { auth } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LAUNCH_DATE, addDays, formatTrtDate, gameDay } from '@/lib/date';
import { DIFFICULTY_TAB_CLASS, DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { getLeaderboard } from '@/lib/game/leaderboard';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { formatDuration } from '@/lib/share';

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
      <h1 className="mb-2 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Sıralama
      </h1>
      {/* Dokunma hedefleri 44 px: oklar eskiden 32 px'lik dairelerdi. */}
      <div className="mb-5 flex items-center justify-center gap-2 text-sm">
        {date > LAUNCH_DATE
          ? <Link href={`/leaderboard?date=${addDays(date, -1)}&difficulty=${difficulty}`} aria-label="Önceki gün"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">←</Link>
          : <span aria-hidden className="flex h-11 w-11 items-center justify-center opacity-30">←</span>}
        <span className="min-w-[10rem] text-center font-medium">{formatTrtDate(date)}</span>
        {date < today
          ? <Link href={`/leaderboard?date=${addDays(date, 1)}&difficulty=${difficulty}`} aria-label="Sonraki gün"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">→</Link>
          : <span aria-hidden className="flex h-11 w-11 items-center justify-center opacity-30">→</span>}
      </div>
      <nav className="mb-6 flex justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <Link key={d} href={`/leaderboard?date=${date}&difficulty=${d}`}
            aria-current={d === difficulty ? 'page' : undefined}
            className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${d === difficulty ? DIFFICULTY_TAB_CLASS[d] : 'border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--paper-raised)]'}`}>
            {DIFFICULTY_LABELS[d]}
          </Link>
        ))}
      </nav>
      {board !== null && !completed && (
        <Link href={`/play/${date}/${difficulty}`}
          className="mb-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 font-semibold text-[var(--paper)] shadow-[0_16px_36px_-24px_var(--ink)] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]">
          <Play aria-hidden className="h-4 w-4 fill-current" />
          {DIFFICULTY_LABELS[difficulty]} Bölümünü Oyna
          {date < today && <span className="text-sm font-normal opacity-70">· arşiv</span>}
        </Link>
      )}
      {board === null
        ? <p className="py-12 text-center text-[var(--ink-soft)]">Bu gün için bulmaca yok.</p>
        : (
          <>
            <LeaderboardTable rows={board.top} myUsername={session?.user?.name} isToday={date === today} />
            {board.me && board.me.rank > 100 && (
              <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3 text-center text-sm">
                Senin sıran: <strong>{board.me.rank}.</strong> · {formatDuration(board.me.durationMs)}
              </p>
            )}
          </>
        )}
    </main>
  );
}
