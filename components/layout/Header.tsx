import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export async function Header() {
  const session = await auth();
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight">Harfiyen</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/leaderboard">Sıralama</Link>
          <Link href="/archive">Arşiv</Link>
          {session
            ? <Link href={`/profile/${session.user.name}`} className="font-medium">{session.user.name}</Link>
            : <Link href="/login" className="flex min-h-11 items-center rounded-full border border-[var(--line)] px-4">Giriş</Link>}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
