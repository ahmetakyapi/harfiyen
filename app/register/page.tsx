import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Üye Ol' };

export default function RegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const { next } = searchParams;
  return (
    <main className="px-4 py-12">
      <h1 className="mb-2 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Üye Ol
      </h1>
      <p className="mb-8 text-center text-sm text-[var(--ink-soft)]">
        Sıralamaya gir, serini başlat — 10 saniye sürer.
      </p>
      {next?.startsWith('/play/') && (
        // Oyuncu buraya kendi isteğiyle gelmedi: bir bulmacaya dokundu ve
        // duvara çarptı. Neden burada olduğunu söylemek en azından bir
        // açıklama borcu.
        <p className="mx-auto mb-5 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3 text-center text-sm text-[var(--ink-soft)]">
          Bulmacayı oynamak için hesap gerekiyor — süren, serin ve sıralaman
          hesabına işlensin diye.
        </p>
      )}
      <AuthForm mode="register" next={next} />
      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Zaten üye misin?{' '}
        <Link className="underline" href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
          Giriş Yap
        </Link>
      </p>
    </main>
  );
}
