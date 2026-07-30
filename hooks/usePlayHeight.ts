'use client';

import { useEffect, useState } from 'react';

export type PlayViewport = {
  height: number | null; // görünür yükseklik (klavye açıkken KÜÇÜLÜR)
  offsetTop: number;     // görünür alanın layout viewport'a göre üst ofseti
  keyboardOpen: boolean; // native klavye açık mı
};

// Girdi kullanıcının KENDİ klavyesinden geliyor. Native klavye açılınca
// `window.innerHeight` DEĞİŞMEZ ama `visualViewport.height` küçülür — oyun
// alanını bu değere sabitlemezsek grid ve ipucu klavyenin altında kalır.
//
// iOS ayrıca odaklanan alanı görünür kılmak için sayfayı kendiliğinden kaydırır;
// `visualViewport.offsetTop` bunu bildirir. Oyun yüzeyini `position: fixed` +
// bu ofsetle konumlandırıp sayfayı kilitleyince o kaydırma etkisiz kalır ve
// ipucu şeridi her zaman ekranın üstünde, okunur biçimde durur.
//
// Pinch-zoom'da da visualViewport küçülür; scale>1 ise innerHeight'a dönerek
// yakınlaştırmanın yerleşimi bozmasını engelliyoruz.
const KEYBOARD_MIN_DELTA = 120; // bundan büyük daralma = klavye açıldı

export function usePlayViewport(): PlayViewport {
  const [vp, setVp] = useState<PlayViewport>({
    height: null, offsetTop: 0, keyboardOpen: false,
  });

  useEffect(() => {
    const vv = window.visualViewport;
    const update = (): void => {
      const zoomed = vv != null && vv.scale > 1.01;
      const h = vv && !zoomed ? vv.height : window.innerHeight;
      setVp({
        height: Math.floor(h),
        offsetTop: vv && !zoomed ? Math.round(vv.offsetTop) : 0,
        keyboardOpen: window.innerHeight - h > KEYBOARD_MIN_DELTA,
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
