import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });
// SOFT + WONK: Fraunces'in düz "büyük serif başlık" hissinden çıkıp gerçek bir
// karakter kazanmasını sağlayan değişken eksenler — sıcak, biraz "el yapımı"
// bir editoryal ton (yalnızca büyük başlık anlarında kullanılıyor, aşırıya kaçmadan).
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'], variable: '--font-fraunces',
  axes: ['opsz', 'SOFT', 'WONK'],
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'], variable: '--font-plex-mono', weight: ['500', '600'],
});

export const metadata: Metadata = {
  title: { default: 'Harfiyen — Günlük Kelime Bulmacası', template: '%s — Harfiyen' },
  description: 'Her gün 09:00\'da üç yeni Türkçe kare bulmaca. Çöz, süreni gör, sıralamaya gir.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  // Çentikli telefonlarda sayfa kenardan kenara uzanır; alt güvenli alan
  // zaten env(safe-area-inset-bottom) ile ele alınıyor.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f0e4' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1322' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} ${plexMono.variable} min-h-dvh bg-[var(--paper)] font-sans text-[var(--ink)] antialiased`}>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
