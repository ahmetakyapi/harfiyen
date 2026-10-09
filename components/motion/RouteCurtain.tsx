'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/types';

// Rotalar arası geçiş perdesi. Bir iç bağlantıya tıklanınca hücreler köşegen
// sırayla ekranı kaplar, ortada gidilen sayfanın adı yükselir; yeni rota
// işlenince (usePathname değişince) hücreler aynı yönde süpürülerek kalkar.
//
// Gezinmeyi GECİKTİRMEZ: Next'in Link'i tıklamayı her zamanki gibi işler,
// perde yalnızca paralel oynar. Sunucu turu (force-dynamic + Neon) zaten
// birkaç yüz ms sürdüğünden perde o bekleyişi "boş ekran" yerine bir
// sahneye çevirir. Hızlı yanıtta perde yine de kapanışını tamamlar, sonra
// açılır — yarım kalan bir perde titreme gibi görünürdü.
//
// Yalnızca YOL değişince oynar: sıralamada zorluk sekmesi, arşivde sayfa
// gibi aynı sayfanın sorgu değişimlerinde her tıklamada perde inmesi
// ağır kaçardı. Geri/ileri gezinmesi (popstate) de perdesizdir.

// globals.css'teki animasyon süreleriyle eşleşir.
const IN_MS = 260;
const OUT_MS = 300;
const STAGGER_TOTAL_MS = 220;
// Rota bu sürede işlenmezse (ağ hatası, aynı sayfaya dönüş) perde yine kalkar.
const SAFETY_MS = 5000;

type Phase = 'idle' | 'in' | 'hold' | 'out';

function labelFor(path: string): string {
  if (path === '/') return 'Bugün';
  if (path.startsWith('/archive')) return 'Arşiv';
  if (path.startsWith('/leaderboard')) return 'Sıralama';
  if (path.startsWith('/how-to-play')) return 'Nasıl Oynanır';
  if (path.startsWith('/login')) return 'Giriş';
  if (path.startsWith('/register')) return 'Üye Ol';
  if (path.startsWith('/profile/')) {
    try { return decodeURIComponent(path.split('/')[2] ?? ''); } catch { return 'Profil'; }
  }
  if (path.startsWith('/play/')) {
    const d = path.split('/')[3] as Difficulty | undefined;
    return d && d in DIFFICULTY_LABELS ? DIFFICULTY_LABELS[d] : 'Bulmaca';
  }
  return 'Harfiyen';
}

function gridFor(w: number, h: number): { cols: number; rows: number } {
  const cols = w < 640 ? 6 : w < 1100 ? 10 : 14;
  const cell = w / cols;
  return { cols, rows: Math.ceil(h / cell) };
}

export function RouteCurtain() {
  const pathname = usePathname() ?? '/';
  const [phase, setPhase] = useState<Phase>('idle');
  const [label, setLabel] = useState('');
  const [grid, setGrid] = useState({ cols: 6, rows: 12 });
  // Hedef yol + "kapanış bitti mi" bayrağı: ikisi birden sağlanınca açılır.
  const target = useRef<string | null>(null);
  const covered = useRef(false);
  const timers = useRef<number[]>([]);

  const clearTimers = (): void => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number): void => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const reveal = useCallback(() => {
    clearTimers();
    target.current = null;
    covered.current = false;
    setPhase('out');
    later(() => setPhase('idle'), OUT_MS + STAGGER_TOTAL_MS + 40);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent): void => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;
      const a = e.target.closest('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let url: URL;
      try { url = new URL(a.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      // Next'in Link'i olmayan, tam sayfa yükleyen bir bağlantı olabilir
      // (api, dosya) — yalnızca uygulama rotalarına perde.
      if (url.pathname.startsWith('/api/')) return;

      clearTimers();
      const { cols, rows } = gridFor(window.innerWidth, window.innerHeight);
      setGrid({ cols, rows });
      setLabel(labelFor(url.pathname));
      target.current = url.pathname;
      covered.current = false;
      setPhase('in');
      later(() => {
        covered.current = true;
        // Rota kapanış sürerken çoktan işlendiyse beklemeden aç.
        if (target.current === null) reveal();
        else setPhase('hold');
      }, IN_MS + STAGGER_TOTAL_MS);
      later(reveal, SAFETY_MS);
    };
    // Yakalama evresi: Link'in kendi onClick'i preventDefault çağırır; kabarma
    // evresinde "bu tıklama gezinme mi" artık ayırt edilemezdi.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [reveal]);

  // Rota işlendi: kapanış bittiyse aç, bitmediyse bittiği an açılacak.
  useEffect(() => {
    if (target.current === null) return;
    if (covered.current) reveal();
    else target.current = null;
  }, [pathname, reveal]);

  useEffect(() => () => clearTimers(), []);

  if (phase === 'idle') return null;

  const { cols, rows } = grid;
  const step = STAGGER_TOTAL_MS / Math.max(1, cols + rows - 2);
  const chars = Array.from(label);
  return (
    <div className="curtain" data-phase={phase} aria-hidden
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${100 / cols}vw` }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        return <span key={i} className="curtain-cell" style={{ '--d': `${(r + c) * step}ms` } as React.CSSProperties} />;
      })}
      <div className="curtain-label">
        <span>
          {chars.map((ch, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties}>{ch}</span>
          ))}
        </span>
        {/* Sunucu yavaşsa (soğuk veritabanı) perde "takıldı" sanılmasın. */}
        <i className="curtain-wait" />
      </div>
    </div>
  );
}
