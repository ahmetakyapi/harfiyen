import { Skeleton, SkeletonPage } from '@/components/ui/Skeleton';

// Kök yükleme sınırı: kendi loading.tsx'i olmayan tüm rotalar (ana sayfa,
// giriş, kayıt, profil, nasıl oynanır) bunu kullanır. Bu yüzden ana sayfanın
// birebir kopyası değil, o ölçülere oturan NÖTR bir sayfa kabuğu: ortalanmış
// başlık + içerik blokları. Ana sayfa için kart yerleşimini birebir tutturur,
// diğerlerinde de "sayfa geliyor" mesajını doğru verir.
export default function Loading() {
  return (
    <SkeletonPage className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <Skeleton className="mx-auto h-6 w-44 rounded-full" />
      <Skeleton className="mx-auto mt-5 h-11 w-72 max-w-full rounded-2xl sm:h-14" />
      <Skeleton className="mx-auto mt-5 h-5 w-56 max-w-full rounded-full" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[5.5rem] rounded-[1.6rem]" />
        ))}
      </div>
      <Skeleton className="mx-auto mt-8 h-4 w-52 max-w-full rounded-full" />
    </SkeletonPage>
  );
}
