# Harfiyen — Tasarım Dokümanı

**Tarih:** 2026-07-18
**Durum:** Onaylandı (Ahmet, 2026-07-18)

## Özet

Harfiyen, günlük Türkçe kare bulmaca oyunudur. Her gün TSİ 00:00'da herkese aynı üç bulmaca açılır (Kolay 7×7, Orta 9×9, Zor 11×11). Oyuncular ipuçlarından kelimeleri bulup grid'e yazar; kelimeler klasik kare bulmacadaki gibi kesişir. Süre tutulur; her zorluğun kendi günlük liderlik tablosu vardır (LinkedIn Games / NYT Mini modeli). Seri (streak), sonuç paylaşımı, profil istatistikleri ve arşiv pratik modu v1 kapsamındadır.

**Teknoloji:** Next.js 14 App Router, TypeScript strict, Tailwind CSS 3, Framer Motion, Drizzle ORM + Neon (serverless), next-auth v5 (Credentials), Vercel. Taban: `~/dev-starter/templates/nextjs-fullstack`.

## Kararlar (özet tablo)

| Konu | Karar |
|------|-------|
| Mekanik | Mini kare bulmaca: hücreye dokun, klavyeyle yaz; kesişen harfler iki kelimeyi doldurur |
| Günlük yapı | Her gün 3 bulmaca (Kolay/Orta/Zor), her birinin ayrı liderlik tablosu |
| Grid boyutları | Kolay 7×7 (~8-10 kelime), Orta 9×9 (~12-16), Zor 11×11 (~18-24) |
| Kimlik | Basit üyelik: kullanıcı adı + şifre (next-auth v5 Credentials, bcrypt) |
| İçerik | Repo içi kelime bankası (JSON) + üreteç script'i; bulmacalar önceden üretilip DB'ye yazılır |
| Hile önleme | Sunucu yetkili oturum: cevaplar istemciye gitmez, süre sunucu saatiyle ölçülür |
| İsim | Harfiyen |
| Görsel yön | "Modern gazete": NYT Games × LinkedIn karışımı — editoryal, göz yormayan, rafine |
| Gün sınırı | Europe/Istanbul (TSİ 00:00) |

## 1. Oyun deneyimi

### Akış

1. Ana sayfa (`/`): günün üç bulmaca kartı (durum: oynanmadı / devam ediyor / bitti + süre), seri sayacı, bir sonraki güne geri sayım.
2. "Başla" → sunucuda oturum açılır, süre başlar. Kısa bir "hazır mısın?" geçiş ekranı olur; grid bu ekrandan önce gösterilmez (süre adaleti).
3. Oyun ekranı: grid üstte, aktif ipucu şeridi ortada, Türkçe ekran klavyesi altta (mobil). Masaüstünde ipucu listeleri yanda, fiziksel klavye kullanılır.
4. Kelime doğru tamamlanınca yumuşak yeşil onay animasyonu. Yanlışsa işaret yok (NYT modeli: sessiz — hücre bazlı doğru/yanlış gösterimi yapılmaz).
5. Tüm hücreler dolu ve tüm kelime hash'leri eşleşince istemci otomatik submit eder → "Bitirdin!" ekranı: süre, günün sıralamasındaki yer, paylaş butonu, diğer zorluklara geçiş.
6. Takılınca **ipucu**: seçili hücrenin harfi sunucudan açılır, süreye **+15 sn ceza** eklenir (sınırsız, her biri ayrı ceza).

### Girdi ve klavye

- Mobil: özel ekran klavyesi — 29 harfli Türkçe alfabe (Q, W, X yok; Ç, Ğ, I, İ, Ö, Ş, Ü var), silme tuşu. Native klavye hiç açılmaz (viewport zıplaması olmaz).
- Masaüstü: fiziksel klavye. Türkçe büyük harf dönüşümü `toLocaleUpperCase('tr-TR')` ile (i→İ, ı→I tuzaklarına dikkat). Ok tuşları hücre gezdirir, Tab/Enter sonraki ipucuna atlar, Boşluk yön değiştirir.
- Hücre davranışı: dokununca seçilir, ikinci dokunuş yön değiştirir (soldan sağa ↔ yukarıdan aşağıya). Harf yazınca aktif kelimede bir sonraki boş hücreye ilerler; kelime bitince sonraki ipucuna geçer. Silme tuşu boş hücrede bir geri gider.

### Misafir ve üyelik

- Misafir günün bulmacalarını oynayabilir (anonim imzalı cookie kimliğiyle sunucu oturumu açılır), süresini görür ama sıralamaya, seriye ve istatistiklere giremez; bitiş ekranında üyelik CTA'sı gösterilir.
- Üyelik: kullanıcı adı (3-20 karakter, benzersiz, küçük harf + rakam + `_`) ve şifre (min 8 karakter, bcrypt hash). E-posta yok.
- **Bilinen sınır (v1):** e-posta olmadığı için şifre kurtarma akışı yok. İleride opsiyonel e-posta alanıyla çözülecek; kayıt ekranında "şifreni unutma" notu gösterilir.
- Misafir oturumları üyeliğe taşınmaz (v1 kapsam dışı).

## 2. Görsel dil — "Modern gazete"

Hedef: NYT Games'in editoryal zarafeti × LinkedIn'in yumuşak, yormayan ürün hissi. Göze kolay, sakin, çok rafine.

- **Işık tema (varsayılan):** kırık beyaz kağıt zemin, mürekkep koyusu metin, tek vurgu rengi (vermilyon / mühür kırmızı-turuncusu). Bol boşluk, ince hairline çizgiler, çok hafif kağıt dokusu.
- **Dark mode ("gece baskısı"):** sıcak koyu zemin, fildişi metin; vurgu rengi aynı ailede kalır. next-themes `class` stratejisi, `suppressHydrationWarning` + `mounted` guard.
- **Tipografi:** Fraunces (serif display — logo, başlıklar, sayılar) + Inter (arayüz metni), `next/font/google` ile. Grid hücre harfleri Inter (yüksek okunabilirlik).
- **Animasyon:** Framer Motion, ease `[0.22, 1, 0.36, 1]`. Hücre dolarken ince pop, kelime tamamlanınca satır boyunca soldan sağa dalga, bitişte zarif ve abartısız kutlama. `prefers-reduced-motion` desteklenir.
- Kesin renk token değerleri uygulama sırasında `frontend-design` skill'i ile belirlenir ve CSS variable olarak tanımlanır (hardcoded renk yok). Bu tema, global CLAUDE.md'deki varsayılan koyu temayı override eder; proje CLAUDE.md'sine not düşülür.
- Mobil öncelikli: 360 px genişlikte 11×11 grid rahat oynanır (hücre ~30 px; giriş ekran klavyesinden olduğu için hücrelere hassas dokunma gerekmez, otomatik ilerleme vardır).

## 3. Sayfalar ve mimari

| Rota | İçerik |
|------|--------|
| `/` | Günün 3 kartı, seri, geri sayım, nasıl oynanır bağlantısı |
| `/oyna/[tarih]/[zorluk]` | Oyun ekranı (`tarih` = `YYYY-MM-DD`, `zorluk` = `kolay\|orta\|zor`) |
| `/siralama` | Gün seçici + zorluk sekmeleri; top 100 + kullanıcının kendi sırası |
| `/profil/[kullaniciadi]` | Herkese açık profil: çözülen sayısı, zorluk bazında ortalama/en iyi süre, seri, son oyunlar |
| `/arsiv` | Geçmiş günler takvim/liste; pratik modu (sıralamasız, `isRanked=false`) |
| `/giris`, `/kayit` | Auth formları |
| `/nasil-oynanir` | Öğretici; ilk ziyarette oyun ekranında modal olarak da gösterilir |

- Sayfalar Server Component ağırlıklı; oyun ekranı `'use client'` bir `GameBoard` bileşeni. Bulmaca verisi (cevapsız) server component'ten prop olarak gelir.
- Mutasyonlar API route'ları üzerinden (aşağıda). DB erişimi `@neondatabase/serverless` (pg değil).
- Grid DOM/CSS grid ile render edilir (canvas/SVG değil): erişilebilirlik, animasyon ve responsive kolaylığı.

### API uçları

| Uç | Görev |
|----|-------|
| `POST /api/oturum/basla` | `{puzzleId}` → aktif oturum döner (varsa mevcut oturumu döner, sıfırlamaz). Sunucu `startedAt` kaydeder. |
| `POST /api/oturum/ipucu` | `{sessionId, row, col}` → o hücrenin harfini döner, `hintCount++`, +15 sn ceza loglanır. Sadece aktif oturumda çalışır. |
| `POST /api/oturum/bitir` | `{sessionId, grid}` → sunucu çözümle karşılaştırır; doğruysa `durationMs = now − startedAt + penaltyMs`, oturum `completed`, sıralama pozisyonu döner. Yanlışsa hata (oturum açık kalır). |
| `GET /api/siralama?tarih=&zorluk=` | Top 100 + istekte kimlik varsa kullanıcının sırası |
| `POST /api/kayit` | Kullanıcı adı + şifre ile kayıt |
| `/api/auth/*` | next-auth v5 route'ları |

## 4. Hile önleme ve oturum kuralları

- Cevaplar istemciye **hiçbir zaman** gönderilmez. İstemciye giden bulmaca verisi: hücre yapısı (siyah/beyaz), numaralar, ipuçları, kelime uzunlukları ve kelime hash'leri.
- **Anında geri bildirim:** her kelime için `SHA-256(puzzlePublicId + ":" + entryNo + ":" + yön + ":" + CEVAP)` hash'i istemciye verilir. Oyuncu kelimeyi doldurunca istemci hash'i hesaplar, eşleşirse yeşil onay. (Hash'ler çevrimdışı brute-force ile kırılabilir; bu bilinçli bir denge — asıl doğrulama ve süre ölçümü sunucudadır.)
- **Süre:** tamamen sunucu saatiyle: `durationMs = submittedAt − startedAt + penaltyMs`. İstemcideki sayaç yalnızca gösterimdir (`startedAt` sunucudan gelir, istemci farkı gösterir).
- Duraklatma yok; sekme/sayfa kapansa da süre işler. Sayfa yeniden açılınca aktif oturum sunucudan bulunur, harfler localStorage'dan (oturum id anahtarıyla) geri yüklenir.
- Sıralamaya yalnızca kullanıcının o bulmacadaki **ilk tamamlanan oturumu** girer. `isRanked = üye girişi var ∧ oturum bulmacanın kendi günü (TSİ) içinde başlatıldı ∧ kullanıcının o bulmacada ilk tamamlanan oturumu`. Misafir oturumları ve arşiv oyunları `isRanked=false`.
- Aynı bulmaca için ikinci `basla` çağrısı yeni oturum açmaz, mevcut aktif oturumu döner. `bitir` idempotent: tamamlanmış oturuma ikinci çağrı aynı sonucu döner.
- Başlamadan `bitir`, başka kullanıcının oturumuna erişim, tamamlanmış oturuma `ipucu` → 4xx hata.
- Sunucu tarafında makul olmayan süreler (ör. < 5 sn) tabloya girmeden önce işaretlenir (`flagged`); v1'de sadece loglanır, otomatik ban yok.

## 5. İçerik üretimi

### Kelime bankası (`content/kelime-bankasi.json`, repo içinde versiyonlu)

```json
{
  "word": "KALEM",
  "clues": ["Yazı yazma aracı", "Mürekkebin yol arkadaşı"],
  "difficulty": 1,
  "tags": ["nesne"]
}
```

- Hedef: ~1000 kelime; her kelimeye 2-3 elle yazılmış ipucu varyantı (tekrar hissini önler).
- Kurallar: yalnızca 29 Türkçe harf, 3-11 harf uzunluk, `tr-TR` büyük harf normalize. Ağırlıklı olarak cins isimler; özel isimler `özel` etiketiyle sınırlı sayıda.
- `difficulty` 1-3: yaygın kelime + doğrudan ipucu = 1; nadir kelime veya dolaylı/esprili ipucu = 3. Kolay bulmaca 1-2'den, zor bulmaca 2-3'ten beslenir; ipucu varyantı da zorluğa göre seçilir.

### Üreteç (`scripts/generate-puzzles.ts`)

- Seed'li RNG (tekrarlanabilir üretim). En uzun kelime merkeze yatay yerleşir; sonra aday konumlar (mevcut harflerle kesişen) puanlanarak backtracking ile yerleştirme sürer.
- Geçerlilik kuralları:
  - Her kelime en az bir başka kelimeyle kesişir; grid tek parça (bağlantılı) olur.
  - Min. kelime uzunluğu 3; yatay/dikey ardışık ≥2 beyaz hücre dizisi mutlaka yerleştirilmiş bir kelimeye karşılık gelir (kazara kelime oluşmaz).
  - Aynı bulmacada kelime tekrarı yok; son 30 günün bulmacalarında çıkan kelimelerden kaçınılır.
  - Doluluk hedefi: beyaz hücre oranı %60-75.
- Çıktı DB'ye yazılır ve tarihe atanır: `npm run generate:puzzles -- --days 120` → 360 bulmaca. Havuz azalınca aynı script uzatır (ileride Vercel cron ile otomatikleştirilebilir; v1'de manuel).
- Bulmaca numarası: lansman tarihinden gün farkı + 1 (`Harfiyen #42`).

## 6. Veri modeli (Drizzle / Neon)

```
users
  id            serial PK
  username      varchar(20) unique, not null
  passwordHash  text not null
  currentStreak int default 0
  bestStreak    int default 0
  lastStreakDate date          -- TSİ gün; seri hesabında kullanılır
  createdAt     timestamptz

puzzles
  id            serial PK
  publicId      varchar unique      -- hash tuzu, URL'de kullanılmaz
  date          date not null
  difficulty    enum('kolay','orta','zor')
  size          int
  layout        jsonb   -- hücreler (siyah/beyaz), numaralar
  entries       jsonb   -- {no, dir, row, col, len, clue} — CEVAPSIZ, istemciye giden
  solution      jsonb   -- cevap grid'i — SADECE sunucu
  wordHashes    jsonb
  unique(date, difficulty)

play_sessions
  id            serial PK
  userId        int FK -> users ON DELETE CASCADE, nullable
  anonId        varchar nullable    -- misafir cookie kimliği
  puzzleId      int FK -> puzzles ON DELETE CASCADE
  startedAt     timestamptz not null
  submittedAt   timestamptz
  durationMs    int
  hintCount     int default 0
  penaltyMs     int default 0
  status        enum('active','completed')
  isRanked      boolean
  flagged       boolean default false
  index (puzzleId, isRanked, durationMs)   -- liderlik sorgusu
```

- Seri güncellemesi: bir günün ilk tamamlanan günlük bulmacasında (zorluk fark etmez) transaction içinde `lastStreakDate` kontrol edilir; ardışıksa `currentStreak++`, değilse 1'e döner; `bestStreak` güncellenir.
- Liderlik sorgusu: `puzzleId + isRanked=true + status=completed`, `durationMs ASC, submittedAt ASC` (beraberlikte erken bitiren önde).
- Profil istatistikleri `play_sessions` üzerinden aggregate sorgularla (v1'de ayrı tablo yok).
- Her migration sonrası Drizzle tipleri yeniden üretilir; migration dosyaları hiç değiştirilmez, yenisi eklenir.

## 7. Paylaşım, seri, istatistik

- **Paylaşım metni** (panoya kopyalanır, spoiler içermez):
  `Harfiyen #142 · Zor · ⏱ 2:47` + satır altında `harfiyen • günlük kelime bulmacası` + URL. Sıralamaya girildiyse `🏅 12.` eklenir.
- **Seri:** herhangi bir zorluğu o gün (TSİ) bitirmek günü sayar. Ana sayfada alev/mühür ikonlu sayaç.
- **Profil:** toplam çözülen, zorluk bazında ortalama ve en iyi süre, mevcut/en iyi seri, son 7 gün mini grafiği. Kullanıcı adıyla herkese açık.

## 8. Hata durumları ve kenar senaryolar

- `bitir` çözümü yanlışsa: oturum açık kalır, istemci "bir şeyler uyuşmuyor" tarzı nazik uyarı gösterir (hangi hücrenin yanlış olduğu söylenmez).
- Ağ hatasında submit exponential backoff ile yeniden denenir; oturum sunucuda açık olduğundan veri kaybı olmaz.
- Gün TSİ 00:00'da döner; oyun sırasında gün değişirse oturum geçerli kalır (oturum başladığı güne bağlıdır).
- Aynı kullanıcı iki cihazda aynı bulmacayı açarsa aynı oturum döner; grid durumu cihazlar arası senkronize edilmez (localStorage), bilinen v1 sınırı.
- localStorage boşsa (gizli sekme vb.) oyuncu kaldığı yerden harfleri kaybeder ama oturum/süre sunucuda doğru işler.

## 9. Test stratejisi

- **Vitest birim testleri:**
  - Üreteç geçerliliği: kesişim, bağlantılılık, min uzunluk, kazara kelime oluşmaması, doluluk aralığı, tekrarsızlık (property-test tarzı: N seed ile üret, hepsini doğrula).
  - Türkçe normalizasyon: `i→İ`, `ı→I`, alfabe dışı karakter reddi.
  - Hash üretimi/eşleşmesi; süre ve ceza hesabı; seri hesabı (gün atlamalı senaryolar).
- **API entegrasyon testleri:** oturum yaşam döngüsü — başlamadan bitir, çift başla, çift bitir (idempotent), yanlış çözüm, başkasının oturumu, misafir akışı. Saf mantık `lib/` altında ayrıştırılır, route handler'lar ince tutulur.
- **Manuel/e2e:** `/verify` ile gerçek akış; deploy öncesi `/deploy` checklist. Playwright v1 sonrası.

## 10. Kapsam dışı (v1)

- Şifre kurtarma, e-posta, sosyal login
- Arkadaş listesi / takip, ülke-şehir tabloları
- Misafir → üyelik skor taşıma
- Cihazlar arası oyun durumu senkronu
- Admin paneli (üretim script + DB yeterli)
- Push bildirim / PWA offline
