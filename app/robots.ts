import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://harfiyen.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Oyun ekranı üyeliğe kapalı ve tarih başına ayrı bir URL üretiyor —
      // arama motorunun tarayacağı bir içerik değil.
      disallow: ['/play/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
