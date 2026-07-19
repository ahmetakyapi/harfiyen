import { DIFFICULTY_TILE } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/types';

// Glifler zorluğu yoğunlukla anlatır — üçü de mini bir bulmaca ızgarası:
//   kolay  → 2×2, iki dolu iki soluk hücre (küçük, ferah bulmaca)
//   orta   → artı işareti: kesişen iki kelime (bulmacanın özü)
//   zor    → dolu 3×3, ortasında gerçek bulmacalardaki gibi siyah hücre
function Glyph({ difficulty }: { difficulty: Difficulty }) {
  if (difficulty === 'easy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
        <rect x="1.4" y="1.4" width="9.6" height="9.6" rx="3" fill="currentColor" />
        <rect x="13" y="1.4" width="9.6" height="9.6" rx="3" fill="currentColor" opacity="0.35" />
        <rect x="1.4" y="13" width="9.6" height="9.6" rx="3" fill="currentColor" opacity="0.35" />
        <rect x="13" y="13" width="9.6" height="9.6" rx="3" fill="currentColor" />
      </svg>
    );
  }
  if (difficulty === 'medium') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
        {/* orta satır + orta sütun dolu (kesişme), köşeler soluk */}
        <rect x="8.8" y="0.8" width="6.4" height="6.4" rx="2" fill="currentColor" />
        <rect x="0.8" y="8.8" width="6.4" height="6.4" rx="2" fill="currentColor" />
        <rect x="8.8" y="8.8" width="6.4" height="6.4" rx="2" fill="currentColor" />
        <rect x="16.8" y="8.8" width="6.4" height="6.4" rx="2" fill="currentColor" />
        <rect x="8.8" y="16.8" width="6.4" height="6.4" rx="2" fill="currentColor" />
        <rect x="0.8" y="0.8" width="6.4" height="6.4" rx="2" fill="currentColor" opacity="0.22" />
        <rect x="16.8" y="0.8" width="6.4" height="6.4" rx="2" fill="currentColor" opacity="0.22" />
        <rect x="0.8" y="16.8" width="6.4" height="6.4" rx="2" fill="currentColor" opacity="0.22" />
        <rect x="16.8" y="16.8" width="6.4" height="6.4" rx="2" fill="currentColor" opacity="0.22" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
      {[0.8, 8.8, 16.8].map((y) =>
        [0.8, 8.8, 16.8].map((x) => (
          <rect key={`${x}:${y}`} x={x} y={y} width="6.4" height="6.4" rx="2"
            fill={x === 8.8 && y === 8.8 ? '#1f2a44' : 'currentColor'} />
        )),
      )}
    </svg>
  );
}

// Zorluk işareti: köşe numaralı bir çengel bulmaca hücresi görünümünde taş.
// Gradyan çerçeve zorluk rengini, krem zemin oyunun "kâğıt" malzemesini
// taşır — her iki temada da aynı fiziksel taş.
export function LetterTile({ difficulty, size = 'md' }: { difficulty: Difficulty; size?: 'sm' | 'md' }) {
  const t = DIFFICULTY_TILE[difficulty];
  const outer = size === 'md' ? 'h-14 w-14 rounded-[1.1rem] p-[2.5px]' : 'h-9 w-9 rounded-[0.7rem] p-[2px]';
  const inner = size === 'md' ? 'rounded-[0.93rem]' : 'rounded-[0.56rem]';
  const glyph = size === 'md' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <span className={`block shrink-0 ${outer} ${t.ringClass} shadow-md`}>
      <span className={`relative flex h-full w-full items-center justify-center ${inner} bg-[#fdf8ec]`}>
        {size === 'md' && (
          <span className="absolute left-1 top-0.5 text-[0.55rem] font-bold leading-none text-[#8b8268]">
            {t.no}
          </span>
        )}
        <span className={`${glyph} ${t.glyphClass}`}><Glyph difficulty={difficulty} /></span>
      </span>
    </span>
  );
}
