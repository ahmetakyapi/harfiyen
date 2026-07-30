// Dokunsal geri bildirim: ekran klavyesi fiziksel bir tuş gibi hissedilsin.
// Vibration API yalnızca Android/Chrome'da var (iOS Safari desteklemez) —
// desteklenmeyen yerde sessizce hiçbir şey yapmaz, çağıran taraf kontrol etmez.
const SOLVE_MS = 18;
const WRONG_PATTERN = [20, 55, 20] as const; // titre-dur-titre: "olmadı" ritmi

function buzz(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // bazı tarayıcılar kullanıcı jesti dışında hata atar — yok say
  }
}

/** Kelime doğru tamamlandı: biraz daha belirgin tek darbe. */
export const hapticSolve = (): void => buzz(SOLVE_MS);

/** Kelime yanlış tamamlandı ve temizlenmek üzere: çift darbe. */
export const hapticWrong = (): void => buzz([...WRONG_PATTERN]);
