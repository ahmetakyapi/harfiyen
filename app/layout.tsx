import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Harfiyen — günlük kelime bulmacası', template: '%s — Harfiyen' },
  description: 'Her gün 09:00\'da üç yeni Türkçe kare bulmaca. Çöz, süreni gör, sıralamaya gir.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-dvh bg-[var(--paper)] text-[var(--ink)] antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
