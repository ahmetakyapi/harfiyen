'use client';

import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/share';

// startedAt/serverNow sunucudan gelir; istemci saat farkı offset ile düzeltilir.
export function Timer({ startedAt, serverNow, penaltyMs, finalMs }: {
  startedAt: string; serverNow: string; penaltyMs: number; finalMs: number | null;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (finalMs !== null) return;
    const id = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [finalMs]);
  const offset = Date.parse(serverNow) - Date.now();
  const elapsed = finalMs ?? Math.max(0, nowMs + offset - Date.parse(startedAt)) + penaltyMs;
  return (
    <span className="font-mono text-lg tabular-nums" aria-label="Geçen süre">
      {formatDuration(elapsed)}
    </span>
  );
}
