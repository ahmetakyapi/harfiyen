import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Giriş — Harfiyen' };

export default function LoginPage() {
  return (
    <main className="px-4 py-12">
      <h1 className="mb-8 text-center font-display text-3xl">Giriş yap</h1>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Hesabın yok mu? <Link className="underline" href="/register">Üye ol</Link>
      </p>
    </main>
  );
}
