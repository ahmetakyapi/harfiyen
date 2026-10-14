import { Flame } from 'lucide-react';

// Seri rozeti. Sayı tablodaki değil BUGÜN geçerli olan seridir (liveStreak):
// kopmuş bir seriyi "5 günlük seri" diye göstermek, oyuncuya olmayan bir şeyi
// vaat ediyordu. Seri dünle bitiyorsa altta tek satırlık bir hatırlatma çıkar —
// günlük oyunun asıl geri dönüş kancası "yarın da gel" değil "bugün kaçırma".
export function StreakBadge({ current, best, atRisk = false }: {
  current: number; best: number; atRisk?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-sm shadow-sm">
        {/* Alev her iki temada da sabit sıcak amber — seri = ateş, mavi alev olmaz. */}
        <Flame aria-hidden className={`h-4 w-4 ${current > 0 ? 'text-[var(--flame)]' : 'text-[var(--ink-soft)]'}`} />
        {current > 0
          ? <span><strong>{current}</strong> günlük seri</span>
          : <span>{best > 0 ? 'Seri koptu' : 'Henüz seri yok'}</span>}
        {best > 0 && best !== current && (
          <span className="text-[var(--ink-soft)]">· en iyi {best}</span>
        )}
      </div>
      {atRisk && (
        <p className="text-center text-sm text-[var(--ink-soft)]">
          Serini sürdürmek için bugün bir bulmaca bitir.
        </p>
      )}
    </div>
  );
}
