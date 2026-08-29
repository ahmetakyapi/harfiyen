import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { clientKey, limit, tooManyRequests } from '@/lib/rate-limit';
import { registerUser } from '@/lib/register';
import { normalizeUsername } from '@/lib/tr';

// Uzunluk tavanları: bcrypt her isteği CPU'ya çevirdiği için gövde boyutu
// serbest bırakılmaz.
const bodySchema = z.object({
  username: z.string().max(40), password: z.string().min(8).max(128),
});

// Kayıt ucu kimliksiz ve her istekte bcrypt çalıştırıyor (~60 ms CPU): hem
// sıralamayı sahte hesaplarla doldurmanın hem de ucuz bir kaynak tüketiminin
// yoluydu.
const MAX_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export async function POST(req: Request): Promise<Response> {
  const gate = limit(`register:${clientKey(req)}`, MAX_PER_HOUR, HOUR_MS);
  if (!gate.ok) return tooManyRequests(gate.retryAfterSec);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Kullanıcı adı ve en az 8 karakter şifre gerekli.' }, { status: 400 });
  }
  const username = normalizeUsername(parsed.data.username);
  const result = await registerUser(getDb(), username, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
