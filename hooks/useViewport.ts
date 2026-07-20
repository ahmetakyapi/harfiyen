'use client';

import { useEffect, useState } from 'react';

// Native klavye açılınca window boyutu DEĞİŞMEZ ama visualViewport küçülür.
// Oyun ekranını bu görünür yüksekliğe göre kurarsak (sayfa hiç kaymadan) grid
// + ipucu her zaman klavyenin üstünde, tam görünür kalır. `compact` yalnızca
// dar ekranlarda (mobil) bu app-shell düzenini uygulamak için.
export function useViewport(): { height: number | null; compact: boolean } {
  const [vp, setVp] = useState<{ height: number | null; compact: boolean }>({
    height: null, compact: false,
  });
  useEffect(() => {
    const vv = window.visualViewport;
    const update = (): void => {
      setVp({
        height: vv ? Math.round(vv.height) : window.innerHeight,
        compact: window.innerWidth < 640,
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
