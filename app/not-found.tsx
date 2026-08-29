import Link from 'next/link';

export const metadata = { title: 'Sayfa Bulunamadı' };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-[var(--line)]">404</p>
      <p className="font-display-flourish mt-2 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text font-display text-3xl text-transparent">
        Bu Sayfa Basılmamış
      </p>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">
        Aradığın bulmaca ya da profil bulunamadı. Yayınlanmamış günler burada görünmez.
      </p>
      <div className="mt-6 flex w-full flex-col gap-2">
        <Link href="/"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-[var(--ink)] font-semibold text-[var(--paper)]">
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
