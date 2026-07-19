import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin', 'latin-ext'], variable: '--font-fraunces', axes: ['opsz'] });

export const metadata: Metadata = {
  title: { default: 'Harfiyen — günlük kelime bulmacası', template: '%s — Harfiyen' },
  description: 'Her gün 09:00\'da üç yeni Türkçe kare bulmaca. Çöz, süreni gör, sıralamaya gir.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4ed' },
    { media: '(prefers-color-scheme: dark)', color: '#16120d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} min-h-dvh bg-[var(--paper)] font-sans text-[var(--ink)] antialiased`}>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
