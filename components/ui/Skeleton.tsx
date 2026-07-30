// Yükleme iskeletlerinin tek yapı taşı. Boyut/köşe çağıran tarafta verilir;
// burada yalnızca "gri, parıldayan yüzey" tanımlı (parıltı: globals.css
// .skeleton). aria-hidden: ekran okuyucuya boş kutular okutmanın anlamı yok —
// bekleme durumu loading.tsx'in kök kabındaki aria-busy ile duyurulur.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-xl ${className}`} />;
}

// Her loading.tsx'in kökü. role/aria-busy ile "içerik geliyor" bilgisini
// yardımcı teknolojiye verir; page-enter ile iskeletin kendisi de sert
// belirmek yerine yumuşak girer.
export function SkeletonPage({ className = '', children }: {
  className?: string; children: React.ReactNode;
}) {
  return (
    <main role="status" aria-busy="true" aria-label="Yükleniyor"
      className={`page-enter ${className}`}>
      {children}
    </main>
  );
}
