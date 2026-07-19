import { DIFFICULTY_TILE } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/types';

// Zorluk işareti: köşe numaralı bir çengel bulmaca hücresi görünümünde
// harf taşı (K/O/Z). Gradyan çerçeve zorluk rengini, krem zemin oyunun
// "kâğıt" malzemesini taşır — her iki temada da aynı fiziksel taş.
export function LetterTile({ difficulty, size = 'md' }: { difficulty: Difficulty; size?: 'sm' | 'md' }) {
  const t = DIFFICULTY_TILE[difficulty];
  const outer = size === 'md' ? 'h-14 w-14 rounded-[1.1rem] p-[2.5px]' : 'h-9 w-9 rounded-[0.7rem] p-[2px]';
  const inner = size === 'md' ? 'rounded-[0.93rem]' : 'rounded-[0.56rem]';
  const letter = size === 'md' ? 'text-2xl' : 'text-sm';
  return (
    <span className={`block shrink-0 ${outer} ${t.ringClass} shadow-md`}>
      <span className={`relative flex h-full w-full items-center justify-center ${inner} bg-[#fdf8ec]`}>
        {size === 'md' && (
          <span className="absolute left-1 top-0.5 text-[0.55rem] font-bold leading-none text-[#8b8268]">
            {t.no}
          </span>
        )}
        <span className={`font-display font-bold leading-none ${letter} ${t.letterClass}`}>{t.letter}</span>
      </span>
    </span>
  );
}
