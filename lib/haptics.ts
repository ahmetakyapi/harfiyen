// Dokunsal geri bildirim: ekran klavyesi fiziksel bir tuş gibi hissedilsin.
// Vibration API yalnızca Android/Chrome'da var (iOS Safari desteklemez) —
// desteklenmeyen yerde sessizce hiçbir şey yapmaz, çağıran taraf kontrol etmez.
const MS = { solve: 18 } as const;

function buzz(ms: number): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // bazı tarayıcılar kullanıcı jesti dışında hata atar — yok say
  }
}

/** Kelime doğru tamamlandı: biraz daha belirgin tek darbe. */
export const hapticSolve = (): void => buzz(MS.solve);
