import Link from 'next/link';
import { auth } from '@/lib/auth';

export async function Header() {
  const session = await auth();
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl tracking-tight">
          Harfiyen<span className="text-[var(--accent)]">.</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/leaderboard">Sıralama</Link>
          <Link href="/archive">Arşiv</Link>
          {session
            ? <Link href={`/profile/${session.user.name}`} className="font-medium">{session.user.name}</Link>
            : <Link href="/login" className="rounded-full border border-[var(--line)] px-3 py-1">Giriş</Link>}
        </nav>
      </div>
    </header>
  );
}
