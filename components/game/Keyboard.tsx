'use client';

import { Delete } from 'lucide-react';
import { hapticTap } from '@/lib/haptics';
import { KEY_ROWS, LOWERCASE_HINT } from '@/lib/keyboard';

// NEDEN ÖZEL KLAVYE: native klavye bu oyun için kullanılamaz. Telefonu Türkçe
// olmayan bir oyuncu Ç/Ğ/İ/Ö/Ş/Ü harflerini uzun basmadan yazamaz, iOS'un
// İngilizce klavyesinde büyük "İ" hiç yoktur — bulmaca çözülemez hâle gelir.
// Ayrıca native klavye viewport'u zıplatır, otomatik düzeltme araya girer.
// Kendi klavyemiz: 29 harf her zaman tek dokunuşta, layout deterministik.
//
// Tuşlar `onPointerDown`da tetiklenir (click'i beklemek ~100 ms gecikme
// hissettirir) ve preventDefault ile metin seçimi / çift dokunuş yakınlaştırma
// engellenir.

// Tuş yüksekliği ekran yüksekliğiyle ölçeklenir — kural globals.css'teki
// .kbd-key sınıfında (media query önceliği orada kesin).
const KEY_BASE =
  'flex select-none items-center justify-center rounded-lg border border-[var(--line)] ' +
  'bg-[var(--paper-raised)] font-semibold text-[var(--ink)] shadow-sm ' +
  'transition-[transform,background-color] duration-75 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'active:scale-95 active:bg-[var(--accent-soft)] disabled:opacity-40';

export function Keyboard({ onKey, onDelete, disabled = false }: {
  onKey: (letter: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const press = (fn: () => void) => (e: React.PointerEvent): void => {
    e.preventDefault();
    if (disabled) return;
    hapticTap();
    fn();
  };

  return (
    <div
      aria-label="Türkçe harf klavyesi"
      // touch-none: klavye üstünde kaydırma/yakınlaştırma jesti oyunu bozmasın.
      // pb: çentikli telefonlarda alt güvenli alan (home indicator) payı.
      className="shrink-0 touch-none select-none px-0.5 pt-1.5"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
      {KEY_ROWS.map((row, i) => (
        // 320 px'de 11 tuşlu satırda her 1 px aralık tuş genişliğinden gider —
        // en dar ekranda aralığı kıs.
        <div key={i} className="mt-1 flex justify-center gap-[3px] first:mt-0 min-[360px]:gap-1">
          {row.map((letter) => (
            <button key={letter} type="button" disabled={disabled}
              onPointerDown={press(() => onKey(letter))}
              // Dokunma hareketi pointerdown'da işlendi; click'in tekrar
              // tetiklenmesini (ve fiziksel klavyede Enter'ın tuşa basmasını)
              // engelle.
              onClick={(e) => e.preventDefault()}
              aria-label={letter}
              className={`${KEY_BASE} kbd-key flex-1 flex-col gap-0 text-[1.0625rem] sm:text-lg`}>
              <span aria-hidden className="leading-none">{letter}</span>
              {LOWERCASE_HINT[letter] && (
                <span aria-hidden className="text-[0.5rem] font-medium leading-none text-[var(--ink-soft)]">
                  {LOWERCASE_HINT[letter]}
                </span>
              )}
            </button>
          ))}
          {/* Silme tuşu son satırda: 8 harf + geniş bir ⌫ (Wordle/NYT dili) */}
          {i === KEY_ROWS.length - 1 && (
            <button type="button" disabled={disabled}
              onPointerDown={press(onDelete)}
              onClick={(e) => e.preventDefault()}
              aria-label="Sil"
              className={`${KEY_BASE} kbd-key flex-[1.7]`}>
              <Delete aria-hidden className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
