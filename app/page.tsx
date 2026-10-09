import Link from 'next/link';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { Countdown } from '@/components/home/Countdown';
import { DailyCard } from '@/components/home/DailyCard';
import { StreakBadge } from '@/components/home/StreakBadge';
import { KineticTitle } from '@/components/motion/KineticTitle';
import { auth } from '@/lib/auth';
import { formatTrtDate, gameDay, puzzleNumber } from '@/lib/date';
import { getDb } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import { DIFFICULTIES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const today = gameDay();

  // Bulmaca listesi ile oturum kimliği birbirini beklemiyor — paralel.
  // `entries` JSONB'i eskiden yalnızca uzunluğu için TAMAMEN çekiliyordu;
  // 10×10'da bu, sayfa başına onlarca kilobayt boşa taşınan ipucu metniydi.
  const [rows, session] = await Promise.all([
    db.select({
      id: puzzles.id, difficulty: puzzles.difficulty, size: puzzles.size,
      wordCount: sql<number>`jsonb_array_length(${puzzles.entries})`,
    }).from(puzzles).where(eq(puzzles.date, today)),
    auth(),
  ]);

  const userId = session ? Number(session.user.id) : null;
  const sessionByPuzzle = new Map<number, { status: string; durationMs: number | null }>();
  let streak: { currentStreak: number; bestStreak: number } | null = null;
  if (userId !== null && rows.length > 0) {
    const [mine, [me]] = await Promise.all([
      db.select({
        puzzleId: playSessions.puzzleId, status: playSessions.status,
        durationMs: playSessions.durationMs,
      }).from(playSessions).where(and(
        inArray(playSessions.puzzleId, rows.map((r) => r.id)),
        eq(playSessions.userId, userId),
      )),
      db.select({ currentStreak: users.currentStreak, bestStreak: users.bestStreak })
        .from(users).where(eq(users.id, userId)),
    ]);
    for (const s of mine) {
      const prev = sessionByPuzzle.get(s.puzzleId);
      if (!prev || s.status === 'completed') {
        sessionByPuzzle.set(s.puzzleId, { status: s.status, durationMs: s.durationMs });
      }
    }
    streak = me ?? null;
  }

  const doneCount = rows.filter((r) => sessionByPuzzle.get(r.id)?.status === 'completed').length;
  const allDone = rows.length > 0 && doneCount === rows.length;
  const totalMs = rows.reduce((sum, r) => sum + (sessionByPuzzle.get(r.id)?.durationMs ?? 0), 0);

  return (
    <main className="page-enter mx-auto max-w-lg px-4 py-8 sm:py-12">
      <AutoRefresh />
      {/* Künye + kinetik başlık. Arkada, merkezden dışa doğru silinen soluk bir
          bulmaca ızgarası: sayfanın kâğıdı, oyunun kâğıdı. */}
      <header className="relative">
        <span aria-hidden className="hero-grid" />
        <KineticTitle text="Günün Bulmacaları"
          className="font-display-flourish relative text-center font-display text-[2.75rem] leading-[1.02] tracking-tight text-[var(--ink)] sm:text-[4.25rem]" />
        {/* Künye bilgisi (tarih + sayı) başlığın ALTINDA, okunur boyda; üstteki
            harflenmiş hap etiket kaldırıldı. */}
        <p className="rise relative mt-3 text-center text-sm font-medium text-[var(--ink-soft)]" style={{ '--i': 2 } as React.CSSProperties}>
          {formatTrtDate(today)} · <span className="font-mono tabular-nums">#{puzzleNumber(today)}</span>
        </p>
        <div className="rise relative mt-5 flex justify-center" style={{ '--i': 3 } as React.CSSProperties}>
          {streak
            ? <StreakBadge current={streak.currentStreak} best={streak.bestStreak} />
            : (
              // Eski metin "oynayabilirsin, üyelik sadece sıralama için" vaadi
              // kuruyordu; oysa /play üyeliğe kapalı. Kapı ne ise onu söylüyoruz.
              <p className="text-center text-sm text-[var(--ink-soft)]">
                Oynamak için <Link href="/register" className="ink-link font-medium text-[var(--ink)]">üye ol</Link> — 10 saniye sürer.
              </p>
            )}
        </div>
      </header>
      <div className="mt-8 flex flex-col gap-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-5 py-10 text-center">
            <p className="font-medium">Bugünün bulmacaları henüz hazır değil.</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Bu beklenmedik bir durum. Bu arada{' '}
              <Link href="/archive" className="underline">arşivden</Link> bir bulmaca çözebilirsin.
            </p>
          </div>
        )}
        {DIFFICULTIES.map((d, i) => {
          const row = rows.find((r) => r.difficulty === d);
          if (!row) return null;
          const s = sessionByPuzzle.get(row.id);
          return (
            // Kartlar masaya dağıtılır gibi gelir: her biri biraz farklı açıyla.
            <div key={d} className="deal" style={{ '--i': i, '--tilt': (i - 1) * 2 } as React.CSSProperties}>
              <DailyCard difficulty={d} size={row.size}
                wordCount={Number(row.wordCount)} date={today}
                status={s?.status === 'completed' ? 'bitti' : s ? 'devam' : 'yeni'}
                durationMs={s?.durationMs ?? null} locked={userId === null} />
            </div>
          );
        })}
      </div>

      {/* Ürün her gün üç bulmaca vaat ediyor; üçünü bitirmenin görsel bir
          karşılığı yoktu. Günün kapanışı burada. */}
      {allDone && (
        <div className="rise mt-6 rounded-2xl border border-[color:color-mix(in_srgb,var(--correct)_40%,transparent)] bg-[var(--correct-soft)] px-5 py-4 text-center" style={{ '--i': 7 } as React.CSSProperties}>
          <p className="font-display text-2xl text-[var(--correct)]">Günün Üçlüsü Tamam</p>
          <p className="mt-1 font-mono text-sm tabular-nums text-[var(--ink-soft)]">
            3/3 · toplam {Math.floor(totalMs / 60000)} dk {Math.round((totalMs % 60000) / 1000)} sn
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/leaderboard"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--correct)_35%,transparent)] bg-[var(--paper-raised)] text-sm font-medium transition-colors hover:bg-[var(--row-hover)]">
              Sıralamayı Gör
            </Link>
            <Link href="/archive"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--correct)_35%,transparent)] bg-[var(--paper-raised)] text-sm font-medium transition-colors hover:bg-[var(--row-hover)]">
              Arşivde Devam Et
            </Link>
          </div>
        </div>
      )}
      {!allDone && doneCount > 0 && (
        <p className="rise mt-6 text-center text-sm text-[var(--ink-soft)]" style={{ '--i': 7 } as React.CSSProperties}>
          Bugün <strong className="text-[var(--ink)]">{doneCount}/{rows.length}</strong> bitti.
        </p>
      )}

      {/* Sonraki baskıya geri sayım: gazete künyesi gibi ince bir şerit.
          "Üyelere açık" notu kaldırıldı — kartların üstündeki kilit rozeti ve
          başlıktaki çağrı aynı şeyi zaten iki kez söylüyordu. */}
      <div className="rise mt-9 flex flex-col items-center gap-3" style={{ '--i': 8 } as React.CSSProperties}>
        <div className="flex w-full items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-[var(--line)]" />
          <p className="shrink-0 text-center text-sm text-[var(--ink-soft)]">
            Yeni bulmacalara <Countdown /> kaldı
          </p>
          <span aria-hidden className="h-px flex-1 bg-[var(--line)]" />
        </div>
        <Link href="/how-to-play"
          className="btn-wipe flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 text-sm font-medium transition-colors hover:border-transparent hover:text-[var(--paper)]">
          Nasıl Oynanır?
        </Link>
      </div>
    </main>
  );
}
