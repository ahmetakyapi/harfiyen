import { Flame } from 'lucide-react';

export function StreakBadge({ current, best }: { current: number; best: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm shadow-sm">
      <Flame className="h-4 w-4 text-[var(--accent)]" />
      <span><strong>{current}</strong> günlük seri</span>
      <span className="text-[var(--ink-soft)]">· en iyi {best}</span>
    </div>
  );
}
