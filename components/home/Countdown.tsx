'use client';

import { useEffect, useState } from 'react';
import { msUntilNextReset } from '@/lib/date';

export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = (): void => setMs(msUntilNextReset());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return <span className="font-mono tabular-nums">--:--:--</span>; // hydration guard
  const total = Math.floor(ms / 1000);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    <span className="font-mono tabular-nums">
      {pad(Math.floor(total / 3600))}:{pad(Math.floor((total % 3600) / 60))}:{pad(total % 60)}
    </span>
  );
}
