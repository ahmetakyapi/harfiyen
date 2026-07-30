import type { MetadataRoute } from 'next';

// Günlük oyunun doğal dağıtım kanalı "ana ekrana ekle": oyuncu her sabah
// tarayıcı adres çubuğuna yazmak yerine ikona dokunur. Standalone modda
// tarayıcı çubuğu kalkar, oyun ekranı tam yüksekliği kullanır.
// (Çevrimdışı/service worker spec §10'da kapsam dışı — bu yalnızca manifest.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Harfiyen — Günlük Kelime Bulmacası',
    short_name: 'Harfiyen',
    description: 'Her gün 09:00\'da üç yeni Türkçe kare bulmaca. Çöz, süreni gör, sıralamaya gir.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f5f0e4',
    theme_color: '#f5f0e4',
    lang: 'tr',
    categories: ['games', 'education'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
