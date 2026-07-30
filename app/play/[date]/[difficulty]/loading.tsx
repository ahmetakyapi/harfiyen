import { Skeleton } from '@/components/ui/Skeleton';

// Oyun ekranı tam ekran ve `position: fixed` (bkz. GameBoard) — iskelet de aynı
// kabı kurar, yoksa geçiş sırasında bir an sayfa akışı görünür, sonra yüzey
// üstüne "atlar". Alt gezinme burada gizli olduğundan (HeaderSlot/BottomNav
// /play'i dışlar) iskelet de kendi başına tüm ekranı kaplar.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Bulmaca yükleniyor"
      className="page-enter fixed inset-0 z-40 flex flex-col overflow-hidden bg-[var(--paper)]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div aria-hidden className="h-[3px] shrink-0 bg-[var(--line)]" />
      <header className="flex shrink-0 items-center gap-2 px-2 py-2 sm:px-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <span className="flex-1" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </header>
      {/* Kare tahta: genişliğe göre büyür ama viewport yüksekliğini aşmaz —
          gerçek grid'in ölçülenmiş hâliyle aynı yeri tutar. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3">
        <Skeleton className="aspect-square w-full max-w-[min(100%,60vh)] rounded-2xl" />
      </div>
      <div className="shrink-0 px-3 pb-4 pt-2">
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}
