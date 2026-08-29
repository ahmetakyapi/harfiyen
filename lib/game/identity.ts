import { cookies } from 'next/headers';
import { currentUserId } from '@/lib/auth';
import { ANON_COOKIE, verifyAnonToken } from '@/lib/anon';
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

// NOT (v1 sapması): Misafir oyunu kapalı. Oyun ekranı ve /api/session/start
// üyelik istiyor (bkz. app/play/[date]/[difficulty]/page.tsx'teki gerekçe:
// misafir → üye geçişi süre sıralamasını anlamsızlaştırıyordu). Bu yüzden
// misafire imzalı çerez YAZAN `ensureIdentity` kaldırıldı — çerezi yazıp aynı
// isteği 401 ile reddetmek en kafa karıştırıcı ara durumdu.
//
// Okuma yolu (`verifyAnonToken`) bilerek duruyor: misafirin oynayabildiği bir
// tanışma bulmacası eklendiğinde imzalı kimlik altyapısı hazır olacak.
