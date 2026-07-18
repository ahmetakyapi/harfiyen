import { formatDuration } from '@/lib/share';
import type { LeaderboardRow } from '@/lib/game/leaderboard';

export function LeaderboardTable({ rows, myUsername }: { rows: LeaderboardRow[]; myUsername?: string | null }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-[var(--ink-soft)]">Bugün henüz kimse bitirmedi — ilk sen ol!</p>;
  }
  return (
    <ol className="divide-y divide-[var(--line)]">
      {rows.map((r) => (
        <li key={r.rank}
          className={`flex items-center gap-4 px-2 py-3 ${r.username === myUsername ? 'bg-[var(--accent-soft)]' : ''}`}>
          <span className="w-8 text-right font-display text-lg tabular-nums">{r.rank}</span>
          <span className="flex-1 truncate">{r.username}</span>
          {r.hintCount > 0 && (
            <span className="text-xs text-[var(--ink-soft)]" title={`${r.hintCount} ipucu`}>💡{r.hintCount}</span>
          )}
          <span className="font-mono tabular-nums">{formatDuration(r.durationMs)}</span>
        </li>
      ))}
    </ol>
  );
}
