import { Skeleton } from '@/components/ui/Skeleton';

// Oyun ekranı tam ekran ve `position: fixed` (bkz. GameBoard) — iskelet de aynı
// kabı kurar, yoksa geçiş sırasında bir an sayfa akışı görünür, sonra yüzey
// üstüne "atlar". Alt gezinme burada gizli olduğundan (HeaderSlot/BottomNav
// /play'i dışlar) iskelet de kendi başına tüm ekranı kaplar.
//
// Şeridin YERİ önemli: gerçek yerleşimde ipucu şeridi grid'in ÜSTÜNDE durur
// (globals.css .play-layout). İskelet onu altta gösterdiği için yükleme bitince
// ekran zıplıyordu.
export default function Loading() {
  return (
    <div aria-busy="true"
      className="page-enter fixed inset-0 z-40 flex flex-col overflow-hidden bg-[var(--paper)]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <p role="status" className="sr-only">Bulmaca yükleniyor</p>
      <div aria-hidden className="h-[3px] shrink-0 bg-[var(--line)]" />
      {/* Başlık, gerçeğiyle aynı ölçüde: 6 öğe, h-11, px-1 py-1 sm:px-3 */}
      <header className="flex shrink-0 items-center gap-1 px-1 py-1 sm:gap-2 sm:px-3">
        <Skeleton className="h-11 w-8 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-[0.7rem]" />
        <Skeleton className="h-5 w-10 rounded-full" />
        <span className="flex-1" />
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-11 w-9 rounded-full" />
        <Skeleton className="h-11 w-20 rounded-full" />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-1.5 pb-1 sm:px-3">
        {/* İpucu şeridi — gerçek yerleşimde olduğu gibi ÜSTTE */}
        <Skeleton className="h-[3.25rem] shrink-0 rounded-2xl" />
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Skeleton className="aspect-square w-full max-w-[min(100%,60vh)] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
