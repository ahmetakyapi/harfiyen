import { notFound } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
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
      <h1 className="text-center font-display text-3xl">{stats.username}</h1>
      <p className="mt-1 text-center text-sm text-[var(--ink-soft)]">
        Üyelik: {formatTrtDate(stats.memberSince)}
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Çözülen', value: String(stats.totalSolved) },
          { label: 'Seri', value: String(stats.currentStreak) },
          { label: 'En iyi seri', value: String(stats.bestStreak) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
            <p className="font-display text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{s.label}</p>
          </div>
        ))}
      </div>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-soft)]">
            <th className="py-2">Zorluk</th><th>Çözülen</th><th>En iyi</th><th>Ortalama</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {DIFFICULTIES.map((d) => {
            const p = stats.perDifficulty[d];
            return (
              <tr key={d}>
                <td className="py-2 font-medium">{DIFFICULTY_LABELS[d]}</td>
                <td>{p.solved}</td>
                <td className="font-mono tabular-nums">{p.bestMs !== null ? formatDuration(p.bestMs) : '—'}</td>
                <td className="font-mono tabular-nums">{p.avgMs !== null ? formatDuration(p.avgMs) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {stats.recent.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-[var(--ink-soft)]">Son oyunlar</h2>
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
          <button type="submit" className="text-sm text-[var(--ink-soft)] underline">Çıkış yap</button>
        </form>
      )}
    </main>
  );
}
