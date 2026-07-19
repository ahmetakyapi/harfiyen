import Link from 'next/link';
import { Archive, Trophy } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const ICON_LINK =
  'flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] ' +
  'text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-raised)] hover:text-[var(--ink)]';

export async function Header() {
  const session = await auth();
  const initial = session?.user?.name?.charAt(0).toLocaleUpperCase('tr-TR') ?? '';
  return (
    <header className="site-header border-b border-[var(--line)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight">Harfiyen</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm sm:gap-4">
          {/* Dar ekranda metin linkleri sıkışıyordu — mobilde ikon butonlar,
              sm ve üstünde metin linkleri (ikisi asla birlikte görünmez). */}
          <Link href="/leaderboard" aria-label="Sıralama" className={`${ICON_LINK} sm:hidden`}>
            <Trophy className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/archive" aria-label="Arşiv" className={`${ICON_LINK} sm:hidden`}>
            <Archive className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/leaderboard" className="hidden hover:text-[var(--accent)] sm:block">Sıralama</Link>
          <Link href="/archive" className="hidden hover:text-[var(--accent)] sm:block">Arşiv</Link>
          {session
            ? (
              <Link href={`/profile/${session.user.name}`} aria-label="Profil"
                className="flex items-center gap-2">
                {/* Profil, imza taş dilinde bir baş harf avatarı: gradyan
                    çerçeve + krem zemin — her ekran boyutunda görünür,
                    kullanıcı adı yalnızca geniş ekranda yanında yazar. */}
                <span className="block h-10 w-10 rounded-full bg-gradient-to-br from-[#3f8fd9] to-[#0d5799] p-[2px] shadow-sm">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-[#fdf8ec] font-display text-sm font-bold text-[#0d5799]">
                    {initial}
                  </span>
                </span>
                <span className="hidden max-w-[7rem] truncate font-medium sm:block">{session.user.name}</span>
              </Link>
            )
            : <Link href="/login" className="flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 font-medium">Giriş</Link>}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
