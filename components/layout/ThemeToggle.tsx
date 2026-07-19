'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-11 w-11" />;
  const dark = resolvedTheme === 'dark';
  return (
    <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
