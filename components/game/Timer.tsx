'use client';

import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/share';

// startedAt/serverNow sunucudan gelir; istemci saat farkı offset ile düzeltilir.
export function Timer({ startedAt, serverNow, penaltyMs, finalMs, className = 'text-base' }: {
  startedAt: string; serverNow: string; penaltyMs: number; finalMs: number | null;
  className?: string; // boyut/renk üst bileşenden: başlıkta küçük, masaüstü HUD'da büyük
}) {
  const [offset] = useState(() => Date.parse(serverNow) - Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (finalMs !== null) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [finalMs]);
  const elapsed = finalMs ?? Math.max(0, nowMs + offset - Date.parse(startedAt)) + penaltyMs;
  return (
    <span className={`font-mono font-semibold tabular-nums text-[var(--ink)] ${className}`} aria-label="Geçen süre">
      {formatDuration(elapsed)}
    </span>
  );
}
