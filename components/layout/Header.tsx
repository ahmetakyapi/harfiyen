import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export async function Header() {
  const session = await auth();
  const initial = session?.user?.name?.charAt(0).toLocaleUpperCase('tr-TR') ?? '';
  return (
    <header className="site-header border-b border-[var(--line)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <Logo className="h-8 w-8 shrink-0" />
          {/* 320 px'lik telefonlarda logo + kelime işareti + 4 nav öğesi
              başlığı yatayda taşırıyordu (sayfa yana kayıyordu). O genişlikte
              yalnızca logo kalır — marka işareti zaten tanınır. */}
          <span className="hidden font-display text-xl font-semibold tracking-tight min-[360px]:inline">
            Harfiyen
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm sm:gap-4">
          {/* Mobilde Sıralama/Arşiv artık alt çubukta (bkz. BottomNav):
              etiketli, başparmak menzilinde ve başlığı 320 px'te sıkıştırmıyor.
              Burada yalnızca sm ve üstündeki metin linkleri kalır. */}
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
            : <Link href="/login" className="flex min-h-10 shrink-0 items-center rounded-full border border-[var(--line)] px-3 font-medium sm:px-4">Giriş</Link>}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
