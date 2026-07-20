'use client';

import { useEffect, useState } from 'react';

export type Viewport = {
  height: number | null;  // görünür yükseklik (visualViewport)
  offsetTop: number;      // görünür alanın layout viewport'a göre üst ofseti
  compact: boolean;       // dar ekran (mobil)
  keyboardOpen: boolean;  // native klavye açık mı (window.innerHeight'tan tahmin)
};

// Native klavye açılınca window boyutu DEĞİŞMEZ ama visualViewport küçülür.
// Klavye açıkken oyun alanını visualViewport'a sabitleyip (position:fixed)
// sayfayı kilitlersek iOS'in "odaklı input'u görünür yap" kaydırması / zoom'u
// devre dışı kalır ve grid + ipucu her zaman klavyenin üstünde kalır.
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>({
    height: null, offsetTop: 0, compact: false, keyboardOpen: false,
  });
  useEffect(() => {
    const vv = window.visualViewport;
    const update = (): void => {
      const h = vv ? Math.round(vv.height) : window.innerHeight;
      setVp({
        height: h,
        offsetTop: vv ? Math.round(vv.offsetTop) : 0,
        compact: window.innerWidth < 640,
        keyboardOpen: window.innerHeight - h > 120,
      });
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return vp;
}
