# Harfiyen

Günlük Türkçe kare bulmaca — her gün TSİ 09:00'da üç yeni bulmaca (Kolay 6×6, Orta 8×8, Zor 10×10),
süre bazlı liderlik tablosu, seri ve arşiv.

## Kurulum

1. `npm install`
2. `.env.local` oluştur (bkz. `.env.example`):
   - `DATABASE_URL` — Neon pooled connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `ANON_COOKIE_SECRET` — `openssl rand -base64 32`
   - `NEXT_PUBLIC_SITE_URL` — paylaşım metni, sitemap ve openGraph için (şema dahil)
   - `CRON_SECRET` — otomatik bulmaca üretimi ucunu korur
3. `npm run db:migrate` — şemayı uygula
4. `npm run generate:puzzles -- --days 120` — bulmaca havuzunu üret
5. `npm run dev`

## Komutlar

- `npm test` — Vitest (PGlite ile DB testleri dahil)
- `npm run typecheck` / `npm run lint` / `npm run build`
- `npm run db:stats` — havuz sağlığı: kaç günlük bulmaca kaldı, kaç kullanıcı/oturum var
- `npm run generator:stats` — üreteç ölçümü (DB gerekmez): üretim başarısı, çapraz
  kontrol oranı, kesişim histogramı, uzunluk karışımı. **Ön ayar değiştirmeden önce çalıştır.**
- `npm run generate:puzzles -- --days N [--start YYYY-MM-DD] [--seed N]` — havuzu uzat;
  `--seed`, bir günün üretimi tükendiğinde farklı bir tohumla yeniden denemek için

## Bulmaca havuzu

Havuz tükenirse site o gün boşalır ve **herkesin serisi kırılır** (geri alınamaz).
Bunu iki katman korur:

- `vercel.json` içindeki haftalık cron `GET /api/cron/generate` ucunu çağırır
  (`Authorization: Bearer $CRON_SECRET`). Havuz 30 günün altına inmişse 21 gün üretir.
- `GET /api/health` yanıtındaki `daysAhead` alanı izlemeye açıktır; `npm run db:stats`
  aynı bilgiyi terminalde verir.

Üretim, kelime tekrar penceresi altında bulmaca başına ~2,5 saniye sürer.

## Mimari

Spec: `docs/superpowers/specs/2026-07-18-harfiyen-design.md`.
Plan: `docs/superpowers/plans/2026-07-18-harfiyen.md`.

- Cevaplar istemciye **hiçbir zaman** gitmez. İstemciye giden kolon listesi tek yerdedir
  (`lib/game/puzzle.ts`) ve `lib/game/puzzle.test.ts` ile teste bağlıdır.
- Süre sunucu saatiyle ölçülür (`lib/game/session.ts`); `isRanked` bitişte yeniden
  doğrulanır, yani dünden kalan bir oturum bugünkü sıralamayı kirletemez.
- Yayınlanmamış (gelecek tarihli) bulmacalar API katmanında da yok sayılır.
- Bulmacalar `content/word-bank.json`'dan `scripts/generate-puzzles.ts` ile üretilir.
  Üreteç, her kelimenin uzunluğuna göre bir kesişim tabanı tutturmaya çalışır
  (`minCrossingsFor`): ipucunu bilemeyen oyuncu kelimeyi kesişimlerden türetebilsin diye.
