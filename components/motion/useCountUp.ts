'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** 0'dan hedefe hızla açılıp yavaşça oturan (expo) sayaç. Hareket azaltma
 *  isteyen kullanıcıda doğrudan hedefi döndürür. */
export function useCountUp(target: number, durationMs = 1100, delayMs = 150): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) { setValue(target); return; }
    let raf = 0;
    let start = 0;
    const tick = (t: number): void => {
      if (!start) start = t;
      const p = Math.min(1, Math.max(0, (t - start - delayMs) / durationMs));
      const eased = p === 1 ? 1 : 1 - 2 ** (-10 * p);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, delayMs, reduce]);
  return value;
}
