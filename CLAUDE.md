# Harfiyen

Günlük Türkçe kare bulmaca oyunu. Tasarım spec'i: `docs/superpowers/specs/2026-07-18-harfiyen-design.md`.

## Proje kuralları (global kuralları override eder)
- Tema: "Modern gazete" — kırık beyaz kağıt + mürekkep + vermilyon vurgu.
  Global koyu tema (#04070d) BU PROJEDE GEÇERLİ DEĞİL. Token'lar `app/globals.css`.
- Font: Fraunces (display) + Inter (UI), next/font/google.
- Büyük harf: her zaman `toLocaleUpperCase('tr-TR')`. Alfabe: ABCÇDEFGĞHIJKLMNOÖPRSŞTUÜVYZ.
- Cevaplar (`puzzles.solution`, `lib/game/session.ts` içi) istemciye ASLA gönderilmez.
- `db.transaction` kullanma (neon-http desteklemez).
- Test: `npm test` (Vitest + PGlite). DB testleri `tests/helpers/testDb.ts` kullanır.
- Mimari adlar İngilizce (rota/API/enum: easy|medium|hard); UI metinleri Türkçe. Rotalar: /play, /leaderboard, /profil, /archive, /login, /register, /how-to-play.
