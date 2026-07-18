import { cookies } from 'next/headers';
import { currentUserId } from '@/lib/auth';
import { ANON_COOKIE, makeAnonToken, verifyAnonToken } from '@/lib/anon';
import type { Identity } from './session';

function secret(): string {
  const s = process.env.ANON_COOKIE_SECRET;
  if (!s) throw new Error('ANON_COOKIE_SECRET tanımlı değil');
  return s;
}

export async function getIdentity(): Promise<Identity> {
  const userId = await currentUserId();
  if (userId !== null) return { userId, anonId: null };
  const token = cookies().get(ANON_COOKIE)?.value ?? '';
  return { userId: null, anonId: verifyAnonToken(token, secret()) };
}

// basla route'unda: misafirse ve cookie yoksa oluşturup yazar
export async function ensureIdentity(): Promise<Identity> {
  const identity = await getIdentity();
  if (identity.userId !== null || identity.anonId !== null) return identity;
  const token = makeAnonToken(secret());
  cookies().set(ANON_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 365, path: '/',
  });
  return { userId: null, anonId: verifyAnonToken(token, secret()) };
}
