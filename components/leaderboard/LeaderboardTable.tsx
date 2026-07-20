import { Lightbulb } from 'lucide-react';
import { formatDuration } from '@/lib/share';
import type { LeaderboardRow } from '@/lib/game/leaderboard';

// İlk üç sıra: imza harf-taşı dilinde gradyan çerçeveli krem taş + parıltı
// (mavi merdiven: 1. lacivert → 3. turkuaz). 4. ve sonrası da AYNI dilde ama
// sade: kenarlı, düz taş + display fontlu numara. Böylece tüm liste "1 2 3"
// mantığında tutarlı görünür.
const PODIUM: Record<number, { ring: string; num: string; glow: string }> = {
  1: { ring: 'bg-gradient-to-br from-[#4a6fd4] to-[#0c2f6b]', num: 'text-[#0c2f6b]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,#0c2f6b_18%,transparent),0_6px_16px_-6px_#0c2f6b]' },
  2: { ring: 'bg-gradient-to-br from-[#3f8fd9] to-[#0d5799]', num: 'text-[#0d5799]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,#0d5799_18%,transparent),0_6px_16px_-6px_#0d5799]' },
  3: { ring: 'bg-gradient-to-br from-[#38c3e8] to-[#0086bf]', num: 'text-[#0083b8]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,#0086bf_18%,transparent),0_6px_16px_-6px_#0086bf]' },
};

export function LeaderboardTable({ rows, myUsername }: { rows: LeaderboardRow[]; myUsername?: string | null }) {
  if (rows.length === 0) {
    return <p className="py-12 text-center text-[var(--ink-soft)]">Bugün henüz kimse bitirmedi — ilk sen ol!</p>;
  }
  return (
    <ol className="overflow-hidden rounded-2xl border border-[var(--line)]">
      {rows.map((r) => {
        const podium = PODIUM[r.rank];
        const isMe = r.username === myUsername;
        return (
          <li key={r.rank}
            className={`flex items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0 ${isMe ? 'bg-[var(--accent-soft)]' : 'bg-[var(--paper-raised)]'}`}>
            {podium
              ? <span className={`block h-9 w-9 shrink-0 rounded-[0.7rem] p-[2px] ${podium.ring} ${podium.glow}`}>
                  <span className={`flex h-full w-full items-center justify-center rounded-[0.56rem] bg-[#fdf8ec] font-display text-base font-bold ${podium.num}`}>
                    {r.rank}
                  </span>
                </span>
              : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] border border-[var(--line)] bg-[var(--paper)] font-display text-base font-semibold text-[var(--ink-soft)]">
                  {r.rank}
                </span>}
            <span className={`flex-1 truncate ${podium ? 'font-semibold' : ''}`}>{r.username}</span>
            {r.hintCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[var(--ink-soft)]" title={`${r.hintCount} ipucu`}>
                <Lightbulb className="h-3.5 w-3.5 text-[#d97706]" />
                {r.hintCount}
              </span>
            )}
            <span className={`font-mono tabular-nums ${podium ? 'font-semibold' : ''}`}>{formatDuration(r.durationMs)}</span>
          </li>
        );
      })}
    </ol>
  );
}
