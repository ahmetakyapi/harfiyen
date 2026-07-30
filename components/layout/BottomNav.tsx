'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, Play, Trophy } from 'lucide-react';

// Mobilde gezinme ALTA taşınır. Başlıktaki ikon düğmeleri etiketsizdi ve
// "kupa" ile "arşiv kutusu" hangi bölüme gittiğini tek bakışta anlatmıyordu;
// üstelik başparmağın en zor ulaştığı yerdeydiler. Alt çubuk hem etiketli hem
// erişilebilir mesafede — telefon uygulamalarının beklenen dili.
// sm ve üstünde gizlenir: orada başlıktaki metin linkleri zaten net.
const ITEMS = [
  { href: '/', label: 'Oyna', Icon: Play },
  { href: '/leaderboard', label: 'Sıralama', Icon: Trophy },
  { href: '/archive', label: 'Arşiv', Icon: Archive },
] as const;

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  // Oyun ekranı tam ekrandır ve kendi gezinmesi vardır (bkz. HeaderSlot) —
  // orada alt çubuk hem yeri boşa harcar hem klavyenin altında kalırdı.
  if (pathname.startsWith('/play/')) return null;

  return (
    <nav aria-label="Ana gezinme"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--paper-raised)]/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, Icon }) => {
          // "/" yalnızca tam eşleşmede aktif; diğerleri alt rotalarını da kapsar
          // (ör. /archive?sayfa=2 ya da ileride /leaderboard/...).
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-1 transition-colors ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--ink-soft)]'
                }`}>
                <Icon aria-hidden className={`h-5 w-5 ${active && href === '/' ? 'fill-current' : ''}`} />
                <span className="text-[0.6875rem] font-medium leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
