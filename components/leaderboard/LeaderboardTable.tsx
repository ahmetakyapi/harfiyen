import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { formatDuration } from '@/lib/share';
import type { LeaderboardRow } from '@/lib/game/leaderboard';

// İlk üç sıra: imza harf-taşı dilinde gradyan çerçeveli krem taş + parıltı
// (mavi merdiven: 1. lacivert → 3. turkuaz). 4. ve sonrası da AYNI dilde ama
// sade: kenarlı, düz taş + display fontlu numara. Böylece tüm liste "1 2 3"
// mantığında tutarlı görünür.
const PODIUM: Record<number, { ring: string; num: string; glow: string }> = {
  1: { ring: 'bg-gradient-to-br from-[var(--ladder-3-from)] to-[var(--ladder-3-to)]', num: 'text-[var(--ladder-3-ink)]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,var(--ladder-3-to)_18%,transparent),0_6px_16px_-6px_var(--ladder-3-to)]' },
  2: { ring: 'bg-gradient-to-br from-[var(--ladder-2-from)] to-[var(--ladder-2-to)]', num: 'text-[var(--ladder-2-ink)]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,var(--ladder-2-to)_18%,transparent),0_6px_16px_-6px_var(--ladder-2-to)]' },
  3: { ring: 'bg-gradient-to-br from-[var(--ladder-1-from)] to-[var(--ladder-1-to)]', num: 'text-[var(--ladder-1-ink)]', glow: 'shadow-[0_0_0_3px_color-mix(in_srgb,var(--ladder-1-to)_18%,transparent),0_6px_16px_-6px_var(--ladder-1-to)]' },
};

export function LeaderboardTable({ rows, myUsername, isToday = true }: {
  rows: LeaderboardRow[]; myUsername?: string | null;
  // Boş durum metni güne göre değişir: geçmiş bir günde "ilk sen ol" çağrısı
  // yanlış — o gün çoktan kapandı, oradaki oyun artık pratik.
  isToday?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] px-5 py-12 text-center">
        <p className="font-display text-xl">
          {isToday ? 'Bugün Henüz Kimse Bitirmedi' : 'O Gün Sıralama Boş Kaldı'}
        </p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {isToday
            ? 'İlk sen ol — adın listenin en üstünde kalır.'
            : 'O günün oyunu artık pratik; süren sıralamaya girmez.'}
        </p>
      </div>
    );
  }
  return (
    <ol className="rise overflow-hidden rounded-2xl border border-[var(--line)]" style={{ '--i': 3 } as React.CSSProperties}>
      {rows.map((r, i) => {
        const podium = PODIUM[r.rank];
        const isMe = r.username === myUsername;
        return (
          // İlk ekranı dolduran satırlar sırayla kayarak girer; sonrası
          // kaydırdıkça (CSS kaydırma zaman çizelgesi).
          <li key={r.rank} style={{ '--i': i } as React.CSSProperties}
            className={`${i < 12 ? 'row-in' : 'reveal'} flex items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 transition-colors last:border-b-0 ${
              isMe ? 'bg-[var(--row-me)]' : 'bg-[var(--paper-raised)] hover:bg-[var(--row-hover)]'
            }`}>
            {podium
              ? <span className={`podium block h-9 w-9 shrink-0 rounded-[0.7rem] p-[2px] ${podium.ring} ${podium.glow}`}>
                  <span className={`flex h-full w-full items-center justify-center rounded-[0.56rem] bg-[var(--tile-face)] font-display text-base font-bold ${podium.num}`}>
                    {r.rank}
                  </span>
                </span>
              : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] border border-[var(--line)] bg-[var(--paper)] font-display text-base font-semibold text-[var(--ink-soft)]">
                  {r.rank}
                </span>}
            {/* Kullanıcı adı profile bağlanır: profiller herkese açık ama
                sıralamadan başka keşif yolu yoktu. */}
            <Link href={`/profile/${r.username}`}
              className={`min-w-0 flex-1 truncate rounded px-1 py-0.5 hover:underline ${podium ? 'font-semibold' : ''}`}>
              {r.username}
            </Link>
            {/* Kendi satırını renk farkıyla bulmak, uzun listede tarama
                gerektiriyordu; rozet onu tek bakışta veriyor. */}
            {isMe && (
              <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-[var(--paper)]">
                Sen
              </span>
            )}
            {r.hintCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[var(--ink-soft)]" title={`${r.hintCount} harf açıldı`}>
                <Lightbulb className="h-3.5 w-3.5 text-[var(--flame)]" />
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
