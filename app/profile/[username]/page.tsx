import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { auth, signOut } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LetterTile } from '@/components/ui/LetterTile';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { CALENDAR_DAYS, getProfileStats } from '@/lib/game/stats';
import { formatDuration } from '@/lib/share';
import { TR_WEEKDAY_SHORT, addDays, formatTrtDate, gameDay, weekdayIndex } from '@/lib/date';
import { normalizeUsername, trUpper } from '@/lib/tr';
import { DIFFICULTIES } from '@/lib/types';
import { CountUp } from '@/components/motion/CountUp';
import { KineticTitle } from '@/components/motion/KineticTitle';

export const dynamic = 'force-dynamic';

// generateMetadata ve sayfa aynı isteği paylaşsın diye önbelleklenir.
const loadStats = cache((username: string) => getProfileStats(getDb(), username));

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const stats = await loadStats(normalizeUsername(params.username));
  if (!stats) return { title: 'Profil' };
  return {
    title: stats.username,
    description: `${stats.username} · ${stats.totalSolved} bulmaca · ${stats.currentStreak} günlük seri`,
  };
}

/**
 * Isı takvimi: sütun başına bir hafta, satır başına bir gün adı.
 *
 * Eskiden hücreler haftaya HİZALANMIYORDU (grid-flow-col ile 56 hücre akıyordu),
 * yani satırlar hiçbir güne karşılık gelmiyordu — "takvim" görünen ama takvim
 * olmayan bir ızgaraydı. Ayrıca yatay kaydırma kutusu içindeydi ve içeriği
 * zaten sığdığı için o kutu yalnızca kaydırmayı yutan bir tuzaktı.
 */
function StreakCalendar({ calendar }: { calendar: Record<string, number> }) {
  const today = gameDay();
  // İlk sütun Pazartesi'den başlasın: geriye doğru en yakın pazartesiye hizala.
  const rawStart = addDays(today, -(CALENDAR_DAYS - 1));
  const start = addDays(rawStart, -weekdayIndex(rawStart));
  const weeks = Math.ceil((weekdayIndex(rawStart) + CALENDAR_DAYS) / 7);

  const tone = (n: number): string =>
    n >= 3 ? 'bg-[var(--correct)]'
      : n === 2 ? 'bg-[color:color-mix(in_srgb,var(--correct)_65%,transparent)]'
        : n === 1 ? 'bg-[color:color-mix(in_srgb,var(--correct)_35%,transparent)]'
          : 'bg-[color:color-mix(in_srgb,var(--line)_70%,transparent)]';

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
      <div className="flex gap-2">
        <div aria-hidden className="flex flex-col gap-1 pt-px">
          {TR_WEEKDAY_SHORT.map((d) => (
            <span key={d} className="flex h-4 items-center font-mono text-[0.6rem] leading-none text-[var(--ink-soft)]">
              {d}
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: weeks * 7 }, (_, i) => {
            // grid-flow-col: index sütun sütun ilerler, satır = haftanın günü.
            const date = addDays(start, i);
            if (date > today) {
              return <span key={date} aria-hidden className="h-4 rounded-[3px]" />;
            }
            const n = calendar[date] ?? 0;
            // Takvim soldan sağa, haftadan haftaya dalga halinde dolar.
            return (
              <span key={date} title={`${formatTrtDate(date)} · ${n}/3`}
                style={{ '--d': Math.floor(i / 7) * 45 + (i % 7) * 12 } as React.CSSProperties}
                className={`cal-cell h-4 rounded-[3px] ${tone(n)}`}>
                <span className="sr-only">{formatTrtDate(date)}: {n} bulmaca</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[0.7rem] text-[var(--ink-soft)]">
        <span>Az</span>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} aria-hidden className={`h-3 w-3 rounded-[3px] ${tone(n)}`} />
        ))}
        <span>Çok</span>
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const stats = await loadStats(normalizeUsername(params.username));
  if (!stats) notFound();
  const session = await auth();
  const isOwn = session?.user?.name === stats.username;
  const initial = stats.username.charAt(0).toLocaleUpperCase('tr-TR');

  return (
    <main className="page-enter mx-auto max-w-lg px-4 py-10">
      <AutoRefresh />

      {/* Künye: baş harf taşı, başlıktaki avatarla aynı dil. */}
      <header className="flex flex-col items-center text-center">
        <span className="avatar-pop block h-16 w-16 rounded-full bg-gradient-to-br from-[var(--ladder-2-from)] to-[var(--ladder-2-to)] p-[3px] shadow-md">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[var(--tile-face)] font-display text-2xl font-bold text-[var(--ladder-2-ink)]">
            {initial}
          </span>
        </span>
        <KineticTitle text={stats.username}
          className="font-display-flourish mt-3 font-display text-[2.5rem] leading-tight tracking-tight" />
        <p className="rise mt-1 text-sm text-[var(--ink-soft)]" style={{ '--i': 2 } as React.CSSProperties}>
          {formatTrtDate(stats.memberSince)} tarihinden beri üye
        </p>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Çözülen', value: stats.totalSolved },
          { label: 'Seri', value: stats.currentStreak },
          { label: 'En İyi Seri', value: stats.bestStreak },
        ].map((s, i) => (
          <div key={s.label} className="deal rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-3 shadow-sm sm:p-4"
            style={{ '--i': i, '--tilt': (i - 1) * 2 } as React.CSSProperties}>
            <p className="font-display text-2xl sm:text-3xl"><CountUp value={s.value} /></p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{s.label}</p>
          </div>
        ))}
      </div>
      {stats.practiceSolved > 0 && (
        // Arşivde harcanan emek hiçbir yerde görünmüyordu; süreleri günlük
        // rekorları kirletmesin diye ayrı bir satırda duruyor.
        <p className="mt-3 text-center text-sm text-[var(--ink-soft)]">
          Arşivde ayrıca <strong className="text-[var(--ink)]">{stats.practiceSolved}</strong> bulmaca çözüldü.
        </p>
      )}

      <div className="reveal">
        <SectionTitle>Son 8 Hafta</SectionTitle>
        <StreakCalendar calendar={stats.calendar} />
      </div>

      <div className="reveal">
        <SectionTitle>Zorluğa Göre</SectionTitle>
        {/* Tablo yerine liste: dört sütunlu tablo 320 px'te yatay kaydırma
            kutusuna sıkışıyordu ve o kutu dikey kaydırmayı da yutuyordu. */}
        <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)]">
          {DIFFICULTIES.map((d) => {
            const p = stats.perDifficulty[d];
            return (
              <li key={d} className="flex items-center gap-3 px-4 py-3">
                <LetterTile difficulty={d} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{DIFFICULTY_LABELS[d]}</span>
                  <span className="block text-xs text-[var(--ink-soft)]">
                    {p.solved > 0 ? `${p.solved} bulmaca` : 'Henüz çözülmedi'}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-nums">
                    {p.bestMs !== null ? formatDuration(p.bestMs) : '—'}
                  </span>
                  <span className="block font-mono text-[0.7rem] tabular-nums text-[var(--ink-soft)]">
                    ort. {p.avgMs !== null ? formatDuration(p.avgMs) : '—'}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {stats.recent.length > 0 && (
        <div className="reveal">
          <SectionTitle>Son Oyunlar</SectionTitle>
          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)]">
            {stats.recent.map((r) => (
              <li key={`${r.date}:${r.difficulty}`}>
                <Link href={`/leaderboard?date=${r.date}&difficulty=${r.difficulty}`}
                  className="flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--row-hover)]">
                  <LetterTile difficulty={r.difficulty} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {formatTrtDate(r.date)}
                    <span className="ml-1.5 text-xs text-[var(--ink-soft)]">
                      {DIFFICULTY_LABELS[r.difficulty]}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums">
                    {formatDuration(r.durationMs)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/"
        className="btn-wipe mt-8 flex min-h-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]">
        Bugünün Bulmacaları
      </Link>

      {isOwn && (
        <form className="mt-6 text-center"
          action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button type="submit" className="min-h-11 px-4 text-sm text-[var(--ink-soft)] underline">
            Çıkış Yap
          </button>
        </form>
      )}
    </main>
  );
}
