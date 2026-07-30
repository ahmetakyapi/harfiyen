'use client';

import { usePathname } from 'next/navigation';

// Oyun ekranı tam ekrandır: kendi başlık şeridi (geri, süre, ipucu) vardır ve
// dikeydeki her piksel grid'e gider — global başlık orada 56 px'i boşa harcar
// ve oyuncuyu ikinci bir gezinme katmanıyla oyalar (NYT/LinkedIn oyunları da
// bulmacayı odak moduna alır). Sunucuda render edilmiş başlık children olarak
// gelir; burada yalnızca gösterilip gösterilmeyeceğine karar verilir.
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/play/')) return null;
  return <>{children}</>;
}
