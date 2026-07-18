import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Üye ol — Harfiyen' };

export default function RegisterPage() {
  return (
    <main className="px-4 py-12">
      <h1 className="mb-2 text-center font-display text-3xl">Üye ol</h1>
      <p className="mb-8 text-center text-sm text-[var(--ink-soft)]">
        Sıralamaya gir, serini başlat — 10 saniye sürer.
      </p>
      <AuthForm mode="register" />
      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Zaten üye misin? <Link className="underline" href="/login">Giriş yap</Link>
      </p>
    </main>
  );
}
