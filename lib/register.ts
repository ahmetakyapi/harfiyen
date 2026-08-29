import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Db } from './db';
import { isUniqueViolation } from './pgError';
import { users } from './schema';

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// Kurtarma akışı yok (e-posta istemiyoruz), yani ele geçirilen hesap kalıcı
// olarak kaybedilir. En sık denenen şifreler bu yüzden baştan reddedilir.
const WEAK_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'parola123', 'qwerty123',
  '11111111', 'sifre123', 'password1', 'iloveyou', 'admin123', 'harfiyen',
]);

export async function registerUser(
  db: Db, username: string, password: string,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  if (!USERNAME_RE.test(username)) {
    // Türkçe harf ayrı mesaj alır: "neden olmadı" sorusunun en sık cevabı bu.
    if (/[çğıöşüâîû]/i.test(username)) {
      return { ok: false, error: 'Kullanıcı adında Türkçe harf kullanılamaz; yalnızca a-z, 0-9 ve _.' };
    }
    return { ok: false, error: 'Kullanıcı adı 3-20 karakter olmalı; küçük harf, rakam ve _ kullanılabilir.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Şifre en az 8 karakter olmalı.' };
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, error: 'Bu şifre çok yaygın. Şifreni kurtaramayız, daha güçlü bir tane seç.' };
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing.length > 0) return { ok: false, error: 'Bu kullanıcı adı alınmış.' };
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [row] = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id });
    return { ok: true, id: row.id };
  } catch (err) {
    // SELECT ile INSERT arasında ~60 ms bcrypt açıklığı var; eşzamanlı iki
    // kayıt isteğinden biri unique ihlaline düşüyordu ve bu ham bir 500 olarak
    // istemciye gidiyordu. Kullanıcının gördüğü şey doğru mesaj olmalı.
    if (isUniqueViolation(err)) return { ok: false, error: 'Bu kullanıcı adı alınmış.' };
    throw err;
  }
}

export async function checkCredentials(
  db: Db, username: string, password: string,
): Promise<{ id: number; username: string } | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username } : null;
}
