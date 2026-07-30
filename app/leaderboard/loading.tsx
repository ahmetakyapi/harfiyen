import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

// Sıralama sayfanın en ağır sorgusu; iskeletin gerçek yerleşime OTURMASI
// burada en çok işe yarıyor — gün gezinmesi, zorluk sekmeleri ve liste kabı
// aynı yüksekliklerde durduğu için veri geldiğinde hiçbir şey yerinden
// oynamıyor (layout shift yok, geçiş "kasma" değil "dolma" gibi hissediliyor).
export default function Loading() {
  return (
    <SkeletonPage className="mx-auto max-w-lg px-4 py-8">
      <Skeleton className="mx-auto h-9 w-40 rounded-2xl" />
      <div className="mb-5 mt-2 flex items-center justify-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="mb-6 flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <Skeleton className="mb-5 h-12 rounded-2xl" />
      {/* Sekiz satır: telefonda ilk ekranı tam dolduran sayı. Daha fazlası
          görünmeyen DOM üretir, daha azı listenin "kısa" olduğunu düşündürür. */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0">
            <Skeleton className="h-9 w-9 shrink-0 rounded-[0.7rem]" />
            <Skeleton className="h-4 flex-1 rounded-full" />
            <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
