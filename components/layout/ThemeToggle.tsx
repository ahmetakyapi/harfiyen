'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-10 w-10" />;
  const dark = resolvedTheme === 'dark';

  // Yeni tema düğmeden yayılan bir daire olarak açılır (View Transitions).
  // next-themes sınıfı bir efektte uygular — anlık görüntü alınırken DOM'un
  // ÇOKTAN değişmiş olması gerektiği için sınıf burada elle de çevrilir.
  // API yoksa ya da hareket azaltma isteniyorsa tema anında değişir.
  const toggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const next = dark ? 'light' : 'dark';
    const doc = document as ViewTransitionDoc;
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const root = document.documentElement;
    const t = doc.startViewTransition(() => {
      root.classList.toggle('dark', next === 'dark');
      root.classList.toggle('light', next === 'light');
      root.style.colorScheme = next;
      setTheme(next);
    });
    void t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => {});
  };

  return (
    <button type="button" onClick={toggle}
      aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="group flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)] hover:text-[var(--ink)]">
      {/* Simge değişirken döne döne yerine gelir. */}
      <span key={dark ? 'sun' : 'moon'} className="block animate-[icon-spin_0.6s_var(--ease-expo)_both]">
        {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </span>
    </button>
  );
}
