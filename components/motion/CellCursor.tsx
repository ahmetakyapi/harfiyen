'use client';

import { motion, useSpring } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Bulmaca hücresi imleci: işaretçiyi yaylı bir kare izler (köşesinde ipucu
// numarası), tıklanabilir bir öğenin üstüne gelince kare o öğenin kutusuna
// genişleyip oyundaki "seçili hücre" halkası gibi onu çerçeveler.
//
// Yalnızca fareli ve hover destekli cihazlarda, hareket azaltma istenmemişse
// bağlanır. Oyun ekranında (/play) KAPALI: orada gerçek hücre seçimi var,
// ikinci bir "seçim" halkası yalnızca kafa karıştırır.
//
// Konum/boyut motion value'larda tutulur — fare her kıpırdadığında React
// yeniden render etmez; yalnızca hover durumu değiştiğinde eder.
const SIZE = 26;
const PAD = 6;
const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], summary, label[for], select';

export function CellCursor() {
  const pathname = usePathname() ?? '';
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  const spring = { stiffness: 520, damping: 40, mass: 0.6 };
  const x = useSpring(-100, spring);
  const y = useSpring(-100, spring);
  const w = useSpring(SIZE, spring);
  const h = useSpring(SIZE, spring);
  const radius = useSpring(7, spring);
  const scale = useSpring(1, { stiffness: 600, damping: 30 });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = (): void => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const active = enabled && !pathname.startsWith('/play/');

  useEffect(() => {
    if (!active) return;
    let target: Element | null = null;
    let px = -100;
    let py = -100;

    // İlk görünüşte yay (-100, -100)'den uçarak gelmesin: doğrudan yerine atlar.
    const place = (immediate = false): void => {
      const put = (mv: typeof x, v: number): void => { if (immediate) mv.jump(v); else mv.set(v); };
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        put(x, r.left - PAD);
        put(y, r.top - PAD);
        put(w, r.width + PAD * 2);
        put(h, r.height + PAD * 2);
        // Halka hedefin köşesini izler: yuvarlak düğmede daire, kartta kartın
        // yarıçapı (+ aradaki boşluk), düz bağlantıda yumuşak bir kare.
        const br = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
        put(radius, Math.min(br + PAD, (Math.min(r.width, r.height) + PAD * 2) / 2));
      } else {
        put(x, px - SIZE / 2);
        put(y, py - SIZE / 2);
        put(w, SIZE);
        put(h, SIZE);
        put(radius, 7);
      }
    };

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      const hit = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
      // Çok büyük yüzeyler (tam genişlik kartlar değil; ekranı kaplayan
      // örtüler) çerçevelenmez — dev bir halka anlamsız.
      const next = hit && hit.getBoundingClientRect().width < window.innerWidth * 0.9 ? hit : null;
      if (next !== target) {
        target = next;
        setHovering(next !== null);
      }
      const first = !shown.current;
      if (first) { shown.current = true; setVisible(true); }
      place(first);
    };
    const onLeave = (): void => { shown.current = false; setVisible(false); };
    const onDown = (): void => { scale.set(0.92); };
    const onUp = (): void => { scale.set(1); };
    const onScroll = (): void => place();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [active, x, y, w, h, radius, scale]);

  // Rota değişince eski sayfadaki öğenin kutusuna takılı kalmasın.
  useEffect(() => { setHovering(false); }, [pathname]);

  if (!active) return null;
  return (
    <motion.div aria-hidden className="cell-cursor"
      data-hover={hovering || undefined}
      style={{ x, y, width: w, height: h, borderRadius: radius, scale, opacity: visible ? 1 : 0 }}>
      <span className="cell-cursor-no">1</span>
    </motion.div>
  );
}
