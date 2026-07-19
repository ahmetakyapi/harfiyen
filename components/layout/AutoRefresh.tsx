'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Durum gösteren sayfalar (ana sayfa, arşiv) her görünüşte tazelenir:
// - mount'ta: istemci router önbelleğinden gelinmişse RSC verisini yenile
//   (bulmaca bitirip geri dönüldüğünde süre/✓ anında görünsün)
// - pageshow(persisted): tarayıcının geri/ileri bfcache restorasyonu React'a
//   hiç uğramaz — staleTimes bunu çözemez, burada yakalanır
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
    const onShow = (e: PageTransitionEvent): void => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [router]);
  return null;
}
