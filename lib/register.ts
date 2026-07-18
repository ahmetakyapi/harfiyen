import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Db } from './db';
import { users } from './schema';

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function registerUser(
  db: Db, username: string, password: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  if (!USERNAME_RE.test(username)) {
    return { ok: false, error: 'Kullanıcı adı 3-20 karakter olmalı; küçük harf, rakam ve _ kullanılabilir.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing.length > 0) return { ok: false, error: 'Bu kullanıcı adı alınmış.' };
  const passwordHash = await bcrypt.hash(password, 10);
  const [row] = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id });
  return { ok: true, id: row.id };
}

export async function checkCredentials(
  db: Db, username: string, password: string,
): Promise<{ id: number; username: string } | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username } : null;
}
