import Link from 'next/link';
import { KineticTitle } from '@/components/motion/KineticTitle';

export const metadata = { title: 'Sayfa Bulunamadı' };

// "404" üç bulmaca hücresi olarak yukarıdan düşer; ortadaki sıfır, yanlış
// tamamlanmış bir kelime gibi sarsılır ve kırmızıya döner — oyunun kendi
// "bu doğru değil" dili.
const TILES = [
  { ch: '4', r: -14 },
  { ch: '0', r: 10, wrong: true },
  { ch: '4', r: -6 },
];

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div aria-hidden className="flex gap-2">
        {TILES.map((t, i) => (
          <span key={i} style={{ '--i': i, '--r': t.r } as React.CSSProperties}
            className={`${t.wrong ? 'drop-tile-shake border-[var(--wrong)] bg-[var(--wrong-soft)] text-[var(--wrong)]' : 'drop-tile border-[var(--line)] bg-[var(--cell)] text-[var(--ink)]'} relative flex h-20 w-20 items-center justify-center rounded-xl border-2 font-display font-semibold shadow-[0_18px_40px_-28px_var(--ink)] sm:h-24 sm:w-24`}>
            {i === 0 && <span className="absolute left-1.5 top-1 font-sans text-[0.65rem] font-bold text-[var(--ink-soft)]">1</span>}
            <span className="text-[2.6rem] leading-none sm:text-5xl">{t.ch}</span>
          </span>
        ))}
      </div>
      <p className="sr-only">404</p>
      <KineticTitle text="Bu Sayfa Basılmamış"
        className="font-display-flourish mt-8 font-display text-[2.1rem] leading-tight tracking-tight" />
      <p className="rise mt-3 text-sm text-[var(--ink-soft)]" style={{ '--i': 4 } as React.CSSProperties}>
        Aradığın bulmaca ya da profil bulunamadı. Yayınlanmamış günler burada görünmez.
      </p>
      <div className="rise mt-6 flex w-full flex-col gap-2" style={{ '--i': 5 } as React.CSSProperties}>
        <Link href="/"
          className="btn-wipe flex min-h-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)]">
          Bugünün Bulmacaları
        </Link>
        <Link href="/archive"
          className="flex min-h-11 items-center justify-center rounded-2xl border border-[var(--line)] text-sm font-medium">
          Arşive Göz At
        </Link>
      </div>
    </main>
  );
}
