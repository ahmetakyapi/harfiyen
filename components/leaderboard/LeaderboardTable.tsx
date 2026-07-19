import { formatDuration } from '@/lib/share';
import type { LeaderboardRow } from '@/lib/game/leaderboard';

// İlk üç sıra için madalya renkleri — paletin geri kalanı mavi ailesinde
// kalsa da altın/gümüş/bronz evrensel olarak "podyum" anlamına geldiğinden
// bilinçli bir istisna; her ikisi de beyaz metinle AA'yı geçiyor.
const MEDAL_CLASS: Record<number, string> = {
  1: 'bg-[#9a6b0a] text-white',
  2: 'bg-[#626d78] text-white',
  3: 'bg-[#8a5a3c] text-white',
};

export function LeaderboardTable({ rows, myUsername }: { rows: LeaderboardRow[]; myUsername?: string | null }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-[var(--ink-soft)]">Bugün henüz kimse bitirmedi — ilk sen ol!</p>;
  }
  return (
    <ol className="overflow-hidden rounded-2xl border border-[var(--line)]">
      {rows.map((r) => {
        const isTop3 = r.rank <= 3;
        const isMe = r.username === myUsername;
        return (
          <li key={r.rank}
            className={`flex items-center gap-3 border-b border-[var(--line)] px-3 py-3 last:border-b-0 ${isMe ? 'bg-[var(--accent-soft)]' : 'bg-[var(--paper-raised)]'}`}>
            {isTop3
              ? <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${MEDAL_CLASS[r.rank]}`}>
                  {r.rank}
                </span>
              : <span className="w-8 shrink-0 text-right text-lg tabular-nums text-[var(--ink-soft)]">{r.rank}</span>}
            <span className={`flex-1 truncate ${isTop3 ? 'font-semibold' : ''}`}>{r.username}</span>
            {r.hintCount > 0 && (
              <span className="text-xs text-[var(--ink-soft)]" title={`${r.hintCount} ipucu`}>💡{r.hintCount}</span>
            )}
            <span className="font-mono tabular-nums">{formatDuration(r.durationMs)}</span>
          </li>
        );
      })}
    </ol>
  );
}
