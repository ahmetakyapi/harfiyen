# Harfiyen

Günlük Türkçe kare bulmaca oyunu. Tasarım spec'i: `docs/superpowers/specs/2026-07-18-harfiyen-design.md`.

## Commit yazarı

Commitler her zaman `Ahmet Akyapı <ahmetakyapii@gmail.com>` adına atılır;
yazarı yalnızca "Claude" olan commit atılmaz. Claude, mesajın sonundaki
`Co-Authored-By: Claude …` satırıyla ortak yazar olarak görünür. Oturum
başında, ilk committen önce:

```bash
git config user.name "Ahmet Akyapı"
git config user.email "ahmetakyapii@gmail.com"
```

Bu kural sahibinin tüm repolarında geçerli (9 Ekim 2026).

## Komutlar
`npm run dev` · `typecheck` · `lint` · `test` (Vitest + PGlite, DB'ye dokunmaz) · `build` ·
`generator:stats` (DB'siz) · `db:push|generate|migrate` · `generate:puzzles`,
`regenerate:future`, `db:stats` (`.env.local`teki DB'ye bağlanır).

## Proje kuralları (global kuralları override eder)
- Tema: "Modern gazete", iki tema (next-themes, `.dark` sınıfı). Açık: kum kâğıt
  (`--paper #f5f0e4`) + lacivert mürekkep + mavi vurgu; koyu: lacivert gece
  (`#0b1322`) + krem mürekkep + altın vurgu. Kırmızı yalnız `--wrong` (hata).
  Global koyu tema (#04070d) BU PROJEDE GEÇERLİ DEĞİL. Renkler yalnız
  `app/globals.css` token'larından (`:root` + `.dark`); hex yazma (istisna:
  `layout.tsx` themeColor ve CSS'siz `global-error.tsx`). Tema token'la döndüğü
  için kodda `dark:` sınıfı yok — yeni bileşen de token kullanır.
- Font: Fraunces (display) + Inter (UI) + IBM Plex Mono, `next/font/google`
  (`latin-ext` şart).
- Büyük harf: her zaman `trUpper` / `toLocaleUpperCase('tr-TR')`. Alfabe
  `lib/tr.ts` → `TR_LETTERS`: 29 harf, I ve İ ayrı (ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ).
- Cevaplar (`puzzles.solution`, `puzzles.words`) istemciye ASLA gönderilmez;
  `solution` yalnız `lib/game/session.ts` içinde okunur.
- İstemciye giden bulmaca alanları TEK yerde: `lib/game/puzzle.ts`
  (`CLIENT_COLUMNS`). Değişmez `lib/game/puzzle.test.ts` ile teste bağlı —
  sorguyu oraya yaz.
- `db.transaction` kullanma (`drizzle-orm/neon-http` desteklemez).
- DB testleri `tests/helpers/testDb.ts` (`createTestDb`, `drizzle/` migration'ları) kullanır.
- Kullanıcı adı normalizasyonu `normalizeUsername` (`lib/tr.ts`) ile yapılır;
  `toLocaleLowerCase('tr-TR')` KULLANMA (I→ı üretip girişi kilitliyor).
- Üreteç ayarı değiştirilecekse önce `npm run generator:stats` ile ölç.
- Mimari adlar İngilizce (rota/API/enum: easy|medium|hard); UI metinleri Türkçe.
  Rotalar: `/`, `/play/[date]/[difficulty]`, `/leaderboard`, `/profile/[username]`,
  `/archive`, `/login`, `/register`, `/how-to-play`.
- Hareket sistemi `app/globals.css` → "HAREKET SİSTEMİ" bölümü; bileşenler
  `components/motion/` (Intro = açılış perdesi, RouteCurtain = sayfa geçişi,
  CellCursor = hücre imleci, KineticTitle, Tilt, CountUp, LetterBurst,
  RollingText). Yalnızca opacity/transform/clip-path canlandır. Sayfa girişleri
  `.rise`/`.deal` (`--i` sırası), kaydırmaya bağlı açılışlar `.reveal`/`.reveal-fold`
  (saf CSS, `animation-timeline: view()`).
- Transform animasyonlu bir kabın içine `position: fixed` öğe koyma (o kap
  içeren blok olur) — diyalogları portal ile body'ye taşı.
- Tailwind'de `bg-[var(--x)]/50` ÇALIŞMAZ (sınıf üretilmez). Saydamlık için
  `bg-[color:color-mix(in_srgb,var(--x)_50%,transparent)]` kullan.
