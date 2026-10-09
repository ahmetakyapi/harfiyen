'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

// Bitiş kutlaması: kartın arkasından Türk alfabesinin harf taşları fışkırır,
// dönerek düşer. Konfeti değil harf — oyunun malzemesi. Rastgelelik
// bileşen bağlanırken bir kez üretilir; yeniden render'da taşlar zıplamaz.
const ALPHABET = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ';
const COUNT = 32;
const TONES = ['var(--diff-easy)', 'var(--diff-medium)', 'var(--correct)', 'var(--flame)', 'var(--ink)'];

export function LetterBurst() {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => Array.from({ length: COUNT }, (_, i) => {
    const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 230 + Math.random() * 200;
    return {
      ch: ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.75 - 60,
      rot: (Math.random() - 0.5) * 540,
      size: 26 + Math.random() * 18,
      delay: Math.random() * 0.12,
      tone: TONES[i % TONES.length],
    };
  }), []);

  if (reduce) return null;
  return (
    // Kendi sabit, taşmayı kesen katmanında: taşlar diyaloğun kaydırılabilir
    // örtüsüne taşsaydı düşerken kaydırma çubukları belirirdi.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute left-1/2 top-1/2 h-0 w-0">
      {pieces.map((p, i) => (
        <motion.span key={i}
          className="absolute flex items-center justify-center rounded-[0.3em] bg-[var(--tile-face)] font-display font-semibold shadow-md"
          style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, fontSize: p.size * 0.58, color: p.tone }}
          initial={{ x: 0, y: 0, scale: 0.2, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.x, p.x * 1.08],
            y: [0, p.y, p.y + 320],
            scale: [0.2, 1, 0.9],
            rotate: [0, p.rot * 0.6, p.rot],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 1.9, delay: 0.1 + p.delay, times: [0, 0.32, 1], ease: ['easeOut', 'easeIn'] }}>
          {p.ch}
        </motion.span>
      ))}
    </div>
    </div>
  );
}
