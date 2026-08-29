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
- İstemciye giden bulmaca alanları TEK yerde: `lib/game/puzzle.ts`. Değişmez
  `lib/game/puzzle.test.ts` ile teste bağlı — sorguyu oraya yaz.
- Kullanıcı adı normalizasyonu `normalizeUsername` (lib/tr.ts) ile yapılır;
  `toLocaleLowerCase('tr-TR')` KULLANMA (I→ı üretip girişi kilitliyor).
- Üreteç ayarı değiştirilecekse önce `npm run generator:stats` ile ölç.
- Mimari adlar İngilizce (rota/API/enum: easy|medium|hard); UI metinleri Türkçe. Rotalar: /play, /leaderboard, /profile, /archive, /login, /register, /how-to-play.
