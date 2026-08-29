'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * `aria-modal="true"` ilan eden bir katmanın klavye sözleşmesi: açılışta odağı
 * içeri al, Tab/Shift+Tab'ı içeride döndür, kapanışta odağı tetikleyen öğeye
 * geri ver. Bunlar olmadan `aria-modal` bir yalan olur — Tab bir tur sonra
 * arkadaki içeriğe kaçar ve geri dönmenin yolu kalmaz.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, open: boolean): void {
  useEffect(() => {
    if (!open) return;
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Açılışta ilk odaklanabilir öğe; hiç yoksa kabın kendisi (tabIndex -1).
    const first = focusables()[0];
    if (first) first.focus();
    else {
      container.tabIndex = -1;
      container.focus();
    }

    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const active = document.activeElement as HTMLElement | null;
      const idx = active ? items.indexOf(active) : -1;
      const nextIdx = e.shiftKey
        ? (idx <= 0 ? items.length - 1 : idx - 1)
        : (idx === -1 || idx === items.length - 1 ? 0 : idx + 1);
      e.preventDefault();
      items[nextIdx].focus();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [ref, open]);
}
