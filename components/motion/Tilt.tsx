'use client';

import { useRef } from 'react';

// İşaretçiyi izleyen perspektif eğimi. Değerler CSS değişkenlerine yazılır
// (React render'ı yok); stil globals.css → .tilt. Dokunmatik ve hareket
// azaltma isteyen kullanıcıda hiç tetiklenmez.
const MAX_DEG = 6;

export function Tilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * MAX_DEG * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * MAX_DEG}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.dataset.active = '';
  };
  const onLeave = (): void => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    delete el.dataset.active;
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}
      className={`tilt relative rounded-[1.6rem] ${className}`}>
      {children}
      <span aria-hidden className="tilt-sheen" />
    </div>
  );
}
