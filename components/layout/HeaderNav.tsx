'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Masaüstü başlık bağlantıları. Etkin sayfanın altındaki mürekkep çizgisi
// sayfalar arasında KAYARAK yer değiştirir (layoutId) — nerede olduğunu
// söyleyen işaret, nereden geldiğini de gösterir.
const LINKS = [
  { href: '/leaderboard', label: 'Sıralama' },
  { href: '/archive', label: 'Arşiv' },
  { href: '/how-to-play', label: 'Nasıl Oynanır' },
] as const;

export function HeaderNav() {
  const pathname = usePathname() ?? '/';
  return (
    <>
      {LINKS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={`relative hidden py-1 transition-colors hover:text-[var(--ink)] sm:block ${active ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
            <span className="ink-link">{label}</span>
            {active && (
              <motion.span layoutId="header-nav-mark" aria-hidden
                className="absolute -bottom-[0.875rem] left-0 right-0 h-[2px] rounded-full bg-[var(--accent)]"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
            )}
          </Link>
        );
      })}
    </>
  );
}
