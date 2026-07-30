'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, Play, Trophy } from 'lucide-react';

// Mobilde gezinme ALTA taşınır. Başlıktaki ikon düğmeleri etiketsizdi ve
// "kupa" ile "arşiv kutusu" hangi bölüme gittiğini tek bakışta anlatmıyordu;
// üstelik başparmağın en zor ulaştığı yerdeydiler. Alt çubuk hem etiketli hem
// erişilebilir mesafede — telefon uygulamalarının beklenen dili.
// sm ve üstünde gizlenir: orada başlıktaki metin linkleri zaten net.
// Yan öğeler. Oyna ortada ve ayrı ele alınır: o bir gezinme sekmesi değil,
// ürünün BİRİNCİL eylemi — sekmelerle aynı ağırlıkta durması onu gizliyordu.
const SIDE = [
  { href: '/leaderboard', label: 'Sıralama', Icon: Trophy },
  { href: '/archive', label: 'Arşiv', Icon: Archive },
] as const;

const LABEL = 'text-[0.6875rem] font-medium leading-none';

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  // Oyun ekranı tam ekrandır ve kendi gezinmesi vardır (bkz. HeaderSlot) —
  // orada alt çubuk hem yeri boşa harcar hem klavyenin altında kalırdı.
  if (pathname.startsWith('/play/')) return null;

  const playing = pathname === '/';
  const side = (i: 0 | 1) => {
    const { href, label, Icon } = SIDE[i];
    // Alt rotalar da kapsanır (ör. /archive?sayfa=2).
    const active = pathname.startsWith(href);
    return (
      <li>
        <Link href={href} aria-current={active ? 'page' : undefined}
          // active:scale — dokunma ile yeni sayfanın gelmesi arasında sunucu
          // turu kadar bir boşluk var; basıldığı AN geri bildirim olmazsa bu
          // boşluk "tıklama gitmedi" gibi okunuyordu. Ortadaki Oyna düğmesinde
          // zaten vardı, yan sekmelerde yoktu.
          className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-1 transition-[color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 ${
            active ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)]'
          }`}>
          <Icon aria-hidden className="h-5 w-5" />
          <span className={LABEL}>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Ana gezinme"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--paper-raised)] sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Üç eşit sütun: orta düğme, etiket genişliklerinden bağımsız olarak tam
          ortada durur. Orta hücre yüksekliğini min-h'tan alır ve düğmeyi AKIŞ
          DIŞINDA taşır — akışta olsaydı yüksekliğiyle çubuğu büyütürdü, oysa
          istenen çubuğun ÜSTÜNE taşması. Düğme yine de kendi hücresinin içinde
          durur: DOM sırası görsel sırayla aynı kalsın (klavye ve ekran okuyucu
          Sıralama → Oyna → Arşiv gezer). */}
      <ul className="mx-auto grid max-w-md grid-cols-3 items-end">
        {side(0)}
        <li className="relative min-h-[3.5rem]">
          <Link href="/" aria-current={playing ? 'page' : undefined}
            // bottom-2.5: yan sekmeler min-h içinde ORTALANDIĞI için etiketleri
            // çubuğun alt kenarından ~10 px yukarıda durur. Ortadaki düğme
            // tabana yapışsaydı etiketi yan etiketlerden alçakta kalır, "Oyna"
            // sözcüğünün çıkıntısı ekranın en alt pikseline değerdi.
            className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
            {/* Dış halka çubuğun zeminiyle aynı renk: düğme çubuktan "oyulmuş"
                gibi durur ve üst kenar çizgisini temiz keser. Çubuk zemini bu
                yüzden yarı saydam DEĞİL — saydam olsaydı halkanın altından
                sayfa içeriği sızar, dikiş yeri görünürdü. */}
            <span className="rounded-full bg-[var(--paper-raised)] p-1.5">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--paper)] shadow-[0_10px_24px_-10px_var(--ink)] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95 ${
                playing ? 'ring-2 ring-inset ring-[var(--accent)]' : ''
              }`}>
                {/* Üçgen glifin optik merkezi geometrik merkezinin solundadır —
                    1 px sağa itilmezse daire içinde sola kaymış görünür. */}
                <Play aria-hidden className="h-6 w-6 translate-x-[1px] fill-current" />
              </span>
            </span>
            <span className={`${LABEL} ${playing ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)]'}`}>
              Oyna
            </span>
          </Link>
        </li>
        {side(1)}
      </ul>
    </nav>
  );
}
