import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { auth, signOut } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { CALENDAR_DAYS, getProfileStats } from '@/lib/game/stats';
import { formatDuration } from '@/lib/share';
import { addDays, formatTrtDate, gameDay } from '@/lib/date';
import { normalizeUsername } from '@/lib/tr';
import { DIFFICULTIES } from '@/lib/types';

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

// Isı takvimi: son 8 hafta, sütun başına bir hafta. Kutunun yoğunluğu o gün
// bitirilen zorluk sayısını (0-3) taşır.
function StreakCalendar({ calendar }: { calendar: Record<string, number> }) {
  const today = gameDay();
  const days = Array.from({ length: CALENDAR_DAYS }, (_, i) => addDays(today, i - CALENDAR_DAYS + 1));
  const tone = (n: number): string =>
    n >= 3 ? 'bg-[var(--correct)]'
      : n === 2 ? 'bg-[var(--correct)]/70'
      : n === 1 ? 'bg-[var(--correct)]/40'
      : 'bg-[var(--line)]/60';
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ width: 'max-content' }}>
        {days.map((d) => {
          const n = calendar[d] ?? 0;
          return (
            <span key={d} title={`${formatTrtDate(d)} · ${n}/3`}
              aria-label={`${formatTrtDate(d)}: ${n} bulmaca`}
              className={`h-3.5 w-3.5 rounded-[3px] ${tone(n)}`} />
          );
        })}
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const stats = await loadStats(normalizeUsername(params.username));
  if (!stats) notFound();
  const session = await auth();
  const isOwn = session?.user?.name === stats.username;

  return (
    <main className="page-enter mx-auto max-w-lg px-4 py-10">
      <AutoRefresh />
      <h1 className="bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        {stats.username}
      </h1>
      <p className="mt-1 text-center text-sm text-[var(--ink-soft)]">
        Üyelik: {formatTrtDate(stats.memberSince)}
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Çözülen', value: String(stats.totalSolved) },
          { label: 'Seri', value: String(stats.currentStreak) },
          { label: 'En İyi Seri', value: String(stats.bestStreak) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-3 shadow-sm sm:p-4">
            <p className="font-display text-2xl sm:text-3xl">{s.value}</p>
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

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-[var(--ink-soft)]">Son 8 Hafta</h2>
      <div className="mt-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-3">
        <StreakCalendar calendar={stats.calendar} />
        <p className="mt-2 text-[0.7rem] text-[var(--ink-soft)]">Koyu kare = o gün üç bulmaca da bitti.</p>
      </div>

      {/* overflow-hidden yuvarlak köşe için dış sarmalayıcıda; tablo kendi
          içinde yatay kaydırılır — 320 px'te sütunlar kırpılıyordu. */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <caption className="sr-only">Zorluk bazında çözülen bulmaca sayısı, en iyi ve ortalama süre</caption>
            <thead>
              <tr className="bg-[var(--paper-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                <th scope="col" className="px-3 py-2.5">Zorluk</th>
                <th scope="col">Çözülen</th>
                <th scope="col">En İyi</th>
                <th scope="col" className="pr-3">Ortalama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {DIFFICULTIES.map((d) => {
                const p = stats.perDifficulty[d];
                return (
                  <tr key={d}>
                    <th scope="row" className="px-3 py-2.5 text-left font-medium">
                      <span className="flex items-center gap-2.5">
                        <LetterTile difficulty={d} size="sm" />
                        {DIFFICULTY_LABELS[d]}
                      </span>
                    </th>
                    <td>{p.solved}</td>
                    <td className="font-mono tabular-nums">{p.bestMs !== null ? formatDuration(p.bestMs) : '—'}</td>
                    <td className="pr-3 font-mono tabular-nums">{p.avgMs !== null ? formatDuration(p.avgMs) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {stats.recent.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-[var(--ink-soft)]">Son Oyunlar</h2>
          <ul className="mt-2 divide-y divide-[var(--line)] text-sm">
            {stats.recent.map((r) => (
              <li key={`${r.date}:${r.difficulty}`}>
                <Link href={`/leaderboard?date=${r.date}&difficulty=${r.difficulty}`}
                  className="flex min-h-11 items-center justify-between gap-3 hover:underline">
                  <span>{formatTrtDate(r.date)} · {DIFFICULTY_LABELS[r.difficulty]}</span>
                  <span className="font-mono tabular-nums">{formatDuration(r.durationMs)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 text-center text-sm">
        <Link href="/" className="underline">Bugünün Bulmacaları →</Link>
      </p>

      {isOwn && (
        <form className="mt-10 text-center"
          action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button type="submit" className="min-h-11 px-4 text-sm text-[var(--ink-soft)] underline">Çıkış Yap</button>
        </form>
      )}
    </main>
  );
}
