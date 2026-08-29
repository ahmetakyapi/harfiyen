// Yükleme iskeletlerinin tek yapı taşı. Boyut/köşe çağıran tarafta verilir;
// burada yalnızca "gri, parıldayan yüzey" tanımlı (parıltı: globals.css
// .skeleton). aria-hidden: ekran okuyucuya boş kutular okutmanın anlamı yok —
// bekleme durumu loading.tsx'in kök kabındaki aria-busy ile duyurulur.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-xl ${className}`} />;
}

// Her loading.tsx'in kökü. `aria-busy` ile "içerik geliyor" bilgisini yardımcı
// teknolojiye verir; page-enter ile iskeletin kendisi de sert belirmek yerine
// yumuşak girer.
//
// role="status" BİLEREK <main> üzerinde DEĞİL: rol, elementin main
// landmark'ını eziyordu — ekran okuyucu kullanıcısı sayfanın ana bölgesine
// atlayamıyordu. Durum duyurusu içerideki sr-only satırdan gelir.
export function SkeletonPage({ className = '', children }: {
  className?: string; children: React.ReactNode;
}) {
  return (
    <main aria-busy="true" className={`page-enter ${className}`}>
      <p role="status" className="sr-only">Yükleniyor</p>
      {children}
    </main>
  );
}
