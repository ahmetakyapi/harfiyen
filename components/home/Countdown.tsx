'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { RollingText } from '@/components/motion/RollingText';
import { gameDay, msUntilNextReset } from '@/lib/date';

export function Countdown() {
  const router = useRouter();
  const [ms, setMs] = useState<number | null>(null);
  const dayRef = useRef<string | null>(null);

  useEffect(() => {
    dayRef.current = gameDay();
    const tick = (): void => {
      setMs(msUntilNextReset());
      // Günün en yoğun anı 09:00'dı ve sayfa o an bayat kalıyordu: sayaç
      // sıfırlanıyor ama kartlar dünün "bitti" durumunu göstermeye devam
      // ediyordu. Gün dönünce sunucu verisini bir kez tazeliyoruz.
      const day = gameDay();
      if (dayRef.current !== day) {
        dayRef.current = day;
        router.refresh();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [router]);

  if (ms === null) return <span className="font-mono tabular-nums">--:--:--</span>; // hydration guard
  const total = Math.floor(ms / 1000);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    // Her hane değiştiğinde yukarıdan düşer — istasyon tabelası gibi. Ekran
    // okuyucu her saniye okumasın diye görsel sayaç aria-hidden; erişilebilir
    // metin yalnızca dakika çözünürlüğünde.
    <span className="font-mono tabular-nums">
      <span className="sr-only">{Math.floor(total / 3600)} saat {Math.floor((total % 3600) / 60)} dakika</span>
      <span aria-hidden>
        <RollingText text={pad(Math.floor(total / 3600))} />:<RollingText text={pad(Math.floor((total % 3600) / 60))} />:<RollingText text={pad(total % 60)} />
      </span>
    </span>
  );
}
