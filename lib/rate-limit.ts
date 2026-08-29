// Basit kayan pencere sayacı.
//
// SINIR: Vercel'de her serverless örneği kendi belleğini tutar, yani bu sayaç
// küresel DEĞİLDİR — dağıtık bir saldırıyı tek başına durdurmaz. Yine de tek
// kaynaktan gelen patlamayı (kayıt botu, şifre denemesi seli, ipucu ile çözüm
// ızgarasını boşaltma) fiilen kesiyor ve hiçbir bağımlılık eklemiyor. Kalıcı
// koruma gerektiğinde arkasına Upstash Redis takılabilir; çağıran taraf
// değişmez.
type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
// Belleğin sınırsız büyümesini engelleyen ucuz temizlik: eşik aşılınca süresi
// dolmuş kayıtlar atılır.
const MAX_BUCKETS = 5_000;

export type LimitResult = { ok: boolean; retryAfterSec: number };

export function limit(key: string, max: number, windowMs: number, now = Date.now()): LimitResult {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  current.count += 1;
  if (current.count > max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Test yardımcısı: sayaçları sıfırlar. */
export function resetLimits(): void {
  buckets.clear();
}

/** Ters vekil arkasında istemci IP'si. Bulunamazsa tek bir kovaya düşer. */
export function clientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'bilinmeyen';
}

export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'Çok fazla deneme. Biraz sonra tekrar dene.' }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) },
    },
  );
}
