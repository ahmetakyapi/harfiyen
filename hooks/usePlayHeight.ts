'use client';

import { useEffect, useState } from 'react';

// Oyun ekranı KAYDIRILMAZ: her şey (başlık, ipucu, grid, klavye) tek ekrana
// sığar. Bunun için gerçek görünür yüksekliğe ihtiyacımız var.
//
// `100dvh` çoğu yerde doğru çalışır ama iOS Safari'de araç çubuğu geçişleri
// sırasında bir kare boyunca eski değeri verebiliyor. visualViewport.height
// her zaman gerçek görünür alanı bildirir — onu tercih edip dvh'yi CSS yedeği
// olarak bırakıyoruz. Native klavye artık hiç açılmadığından (girdi kendi ekran
// klavyemizden gelir) bu değer klavye yüzünden zıplamaz.
//
// Pinch-zoom'da visualViewport küçülür; o durumda innerHeight'a dönerek
// yakınlaştırmanın layout'u bozmasını engelliyoruz.
export function usePlayHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const update = (): void => {
      const zoomed = vv !== null && vv !== undefined && vv.scale > 1.01;
      const h = vv && !zoomed ? vv.height : window.innerHeight;
      // Alt piksele yuvarlama: yükseklik sürekli 0.5px oynayınca ResizeObserver
      // döngüsüne girmesin.
      setHeight(Math.floor(h));
    };
    update();
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return height;
}
