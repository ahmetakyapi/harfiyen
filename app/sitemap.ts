import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://harfiyen.vercel.app';

// Herkese açık ve içeriği zamanla değişmeyen sayfalar. Arşiv/sıralama günlük
// döndüğü için tekil gün URL'leri listelenmiyor (sonsuz büyüyen sitemap).
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/how-to-play', '/leaderboard', '/archive', '/login', '/register'];
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));
}
