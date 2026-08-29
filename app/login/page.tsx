import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Giriş Yap' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const { next } = searchParams;
  return (
    <main className="px-4 py-12">
      <h1 className="mb-8 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Giriş Yap
      </h1>
      {next?.startsWith('/play/') && (
        // Oyuncu buraya kendi isteğiyle gelmedi: bir bulmacaya dokundu ve
        // duvara çarptı. Neden burada olduğunu söylemek en azından bir
        // açıklama borcu.
        <p className="mx-auto mb-5 max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3 text-center text-sm text-[var(--ink-soft)]">
          Bulmacayı oynamak için hesap gerekiyor — süren, serin ve sıralaman
          hesabına işlensin diye.
        </p>
      )}
      <AuthForm mode="login" next={next} />
      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Hesabın yok mu?{' '}
        <Link className="underline" href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>
          Üye Ol
        </Link>
      </p>
    </main>
  );
}
