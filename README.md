# Harfiyen

Günlük Türkçe kare bulmaca — her gün TSİ 09:00'da üç yeni bulmaca (Kolay 6×6, Orta 8×8, Zor 10×10),
süre bazlı liderlik tablosu, seri ve arşiv.

## Kurulum

1. `npm install`
2. `.env.local` oluştur (bkz. `.env.example`):
   - `DATABASE_URL` — Neon pooled connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `ANON_COOKIE_SECRET` — `openssl rand -base64 32`
3. `npm run db:migrate` — şemayı uygula
4. `npm run generate:puzzles -- --days 120` — bulmaca havuzunu üret
5. `npm run dev`

## Komutlar

- `npm test` — Vitest (PGlite ile DB testleri dahil)
- `npm run typecheck` / `npm run lint` / `npm run build`
- `npm run generate:puzzles -- --days N [--start YYYY-MM-DD] [--seed N]` — havuzu uzat (ayda bir çalıştır); `--seed` bir günün üretimi tükendiğinde (nadir, ~0.25% ihtimal) farklı bir tohum ile yeniden denemek için

## Mimari

Spec: `docs/superpowers/specs/2026-07-18-harfiyen-design.md`.
Plan: `docs/superpowers/plans/2026-07-18-harfiyen.md`.
Cevaplar istemciye gitmez; süre sunucu saatiyle ölçülür (`lib/game/session.ts`).
Bulmacalar `content/word-bank.json`'dan `scripts/generate-puzzles.ts` ile üretilir.
