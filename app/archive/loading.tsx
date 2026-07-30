import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

// Künye çizgileri iskelette de GERÇEK çizgi olarak durur (Skeleton değil):
// ince kurallar zaten nihai hâlleriyle çizilebiliyor, onları da gri bloğa
// çevirmek sayfayı olduğundan daha "boş" gösterirdi.
export default function Loading() {
  return (
    <SkeletonPage className="mx-auto max-w-5xl px-4 py-10">
      <header className="text-center">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
          <Skeleton className="h-3 w-36 rounded-full" />
          <span aria-hidden className="h-px w-10 bg-[var(--line)] sm:w-20" />
        </div>
        <Skeleton className="mx-auto mt-3 h-10 w-40 rounded-2xl sm:h-12" />
        <Skeleton className="mx-auto mt-2 h-4 w-80 max-w-full rounded-full" />
        <Skeleton className="mx-auto mt-1 h-3 w-44 rounded-full" />
      </header>
      {/* Altı kart: 1 sütunda 6, 2 sütunda 3, 3 sütunda 2 sıra — her kırılımda
          ilk ekranı doldurur. Kart yüksekliği ArchiveDayCard'ın gerçek
          yüksekliği (şerit + künye + üç zorluk satırı). */}
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[13.5rem] rounded-[1.4rem]" />
        ))}
      </div>
    </SkeletonPage>
  );
}
