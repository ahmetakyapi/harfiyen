'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Bu sayfa yüklenişinde RSC verisi hangi URL'ler için taze alındı. Modül
// seviyesinde tutulur: sekme yenilenince kendiliğinden sıfırlanır.
const fetched = new Set<string>();

// Durum gösteren sayfalar (ana sayfa, arşiv, sıralama, oyun) geri dönüşte
// tazelenir — ama sayfaya İLK gelişte değil.
//
// Neden ayrım: next.config'de `staleTimes.dynamic = 0`, yani bir URL'ye ileri
// yönde gidildiğinde RSC verisi zaten sunucudan yeni geliyor. Buna rağmen
// mount'ta koşulsuz `router.refresh()` çağrılıyordu; her gezinme sunucuya İKİ
// tur atıyor ve ikinci tur bitene kadar sayfa "hâlâ yükleniyor" gibi
// duruyordu. Ağır sorgulu sıralama sayfasında gecikmeyi ikiye katlayan tek en
// büyük sebep buydu.
//
// Tazelemenin gerçekten şart olduğu iki durum korunuyor:
// - Aynı URL'ye ikinci kez gelmek: geri/ileri gezinmesi staleTimes'tan
//   bağımsız olarak istemci önbelleğinden servis edilir; bulmacayı bitirip
//   ana sayfaya dönünce süre/✓ ancak bu tazelemeyle görünür.
// - pageshow(persisted): tarayıcının bfcache restorasyonu React'a hiç
//   uğramaz — staleTimes bunu çözemez, burada yakalanır.
//
// Anahtar sorgu dizesini de içerir: /leaderboard?difficulty=easy ile
// ?difficulty=medium ayrı sayfalardır, zorluk sekmesine her basışta gereksiz
// tazeleme olmasın.
export function AutoRefresh() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const query = useSearchParams()?.toString() ?? '';

  useEffect(() => {
    const key = query ? `${pathname}?${query}` : pathname;
    if (fetched.has(key)) router.refresh();
    else fetched.add(key);

    const onShow = (e: PageTransitionEvent): void => {
      if (e.persisted) router.refresh();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, [router, pathname, query]);

  return null;
}
