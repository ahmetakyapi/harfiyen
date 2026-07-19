import { notFound } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { getProfileStats } from '@/lib/game/stats';
import { formatDuration } from '@/lib/share';
import { formatTrtDate } from '@/lib/date';
import { DIFFICULTIES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const stats = await getProfileStats(getDb(), params.username.toLocaleLowerCase('tr-TR'));
  if (!stats) notFound();
  const session = await auth();
  const isOwn = session?.user?.name === stats.username;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
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
      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--paper-raised)] text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              <th className="px-3 py-2.5">Zorluk</th><th>Çözülen</th><th>En İyi</th><th className="pr-3">Ortalama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {DIFFICULTIES.map((d) => {
              const p = stats.perDifficulty[d];
              return (
                <tr key={d}>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2.5 font-medium">
                      <LetterTile difficulty={d} size="sm" />
                      {DIFFICULTY_LABELS[d]}
                    </span>
                  </td>
                  <td>{p.solved}</td>
                  <td className="font-mono tabular-nums">{p.bestMs !== null ? formatDuration(p.bestMs) : '—'}</td>
                  <td className="pr-3 font-mono tabular-nums">{p.avgMs !== null ? formatDuration(p.avgMs) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stats.recent.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-[var(--ink-soft)]">Son Oyunlar</h2>
          <ul className="mt-2 divide-y divide-[var(--line)] text-sm">
            {stats.recent.map((r) => (
              <li key={`${r.date}:${r.difficulty}`} className="flex justify-between py-2">
                <span>{formatTrtDate(r.date)} · {DIFFICULTY_LABELS[r.difficulty]}</span>
                <span className="font-mono tabular-nums">{formatDuration(r.durationMs)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {isOwn && (
        <form className="mt-10 text-center"
          action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button type="submit" className="text-sm text-[var(--ink-soft)] underline">Çıkış Yap</button>
        </form>
      )}
    </main>
  );
}
