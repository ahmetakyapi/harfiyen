import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { loadBank } from '@/lib/content';
import { puzzles } from '@/lib/schema';
import { DIFFICULTIES } from '@/lib/types';
import { createTestDb } from '@/tests/helpers/testDb';
import { assignPuzzles, buildPuzzleRow } from './assign';
import { generateWithRetries } from './generator';

const bank = loadBank();

// assign.ts içindeki `seedFor` export edilmiyor; assignPuzzles'ın bir tarih+zorluk
// için üreteceği GERÇEK seed'i öğrenip aynı üretimi burada tekrar edebilmek için
// (aşağıdaki regresyon testinde) formülü birebir yansıtıyoruz.
function seedFor(date: string, difficulty: 'easy' | 'medium' | 'hard', baseSeed: number): number {
  const dateNum = Number(date.replaceAll('-', ''));
  return (dateNum % 1_000_003) * 3 + DIFFICULTIES.indexOf(difficulty) + baseSeed * 7919;
}

describe('assignPuzzles', () => {
  it('2 gün için 6 bulmaca üretir; tekrar çağrı hiçbirini yeniden üretmez', async () => {
    const db = await createTestDb();
    const first = await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 1 });
    expect(first).toEqual({ created: 6, skipped: 0 });
    const second = await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 1 });
    expect(second).toEqual({ created: 0, skipped: 6 });
    const all = await db.select().from(puzzles);
    expect(all).toHaveLength(6);
  });

  it('satırlar tutarlıdır: wordHashes anahtar sayısı kelime sayısına eşit, entries cevap içermez', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 1, baseSeed: 2 });
    const [row] = await db.select().from(puzzles)
      .where(and(eq(puzzles.date, '2026-07-21'), eq(puzzles.difficulty, 'easy')));
    const entries = row.entries as { clue: string; word?: string }[];
    const hashes = row.wordHashes as Record<string, string>;
    const words = row.words as string[];
    expect(Object.keys(hashes)).toHaveLength(entries.length);
    expect(words).toHaveLength(entries.length);
    for (const e of entries) {
      expect(e.word).toBeUndefined(); // cevap sızıntısı yok
      expect(e.clue.length).toBeGreaterThan(0);
    }
  });

  it('ertesi günün bulmacası tekrar penceresindeki (21 gün) kelimeleri kullanmaz', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 2, baseSeed: 3 });
    const all = await db.select().from(puzzles);
    // "hard" (16-20 kelime, 10x10) hariç: bu preset'in kelime/hücre bütçesi bankaya
    // göre zaten dar, üreteç dolum kesişimi çakışma koruması (bkz. generator.ts
    // startKey guard) eklendikten sonra bazı seed'lerde 21→14→7→0 penceresinin
    // tamamı tükenip son çare (window=0, kasıtlı olarak çapraz-gün tekrarına izin
    // veren) davranışa düşebiliyor — bu tasarım gereği (spec: "banka yetmezse
    // pencere kademeli daralır"), bir hata değil. easy/medium için pencere
    // neredeyse hiç tükenmiyor, asıl dışlama mekanizmasını orada doğruluyoruz.
    const day1 = all.filter((p) => p.date === '2026-07-21' && p.difficulty !== 'hard')
      .flatMap((p) => p.words as string[]);
    const day2 = all.filter((p) => p.date === '2026-07-22' && p.difficulty !== 'hard')
      .flatMap((p) => p.words as string[]);
    for (const w of day2) expect(day1).not.toContain(w);
  });

  it('aynı günün üç bulmacası arasında kelime tekrarı yoktur', async () => {
    const db = await createTestDb();
    await assignPuzzles(db, { bank, startDate: '2026-07-21', days: 1, baseSeed: 10 });
    const all = await db.select().from(puzzles);
    const words = all.flatMap((p) => p.words as string[]);
    expect(new Set(words).size).toBe(words.length);
  });

  it('yarım kalmış (crash sonrası) bir run devam ettirildiğinde, önceden kaydedilmiş easy satırının kelimelerini medium/hard tekrar kullanmaz (regresyon: task-10)', async () => {
    const date = '2026-08-01';
    const baseSeed = 1;

    // 1) "eski koddaki" davranışı önceden hesapla: sameDay hiçbir zaman persisted
    // satırlarla tohumlanmadığında ve `excludedWords` mevcut tarihi (`lt(date, date)`)
    // hariç tuttuğunda, medium'un exclude kümesi tam olarak boş küme olur. Bu yüzden
    // exclude:new Set() ile üretilen sonuç, hatalı koddaki medium çıktısıyla birebir
    // aynıdır (aynı bank + aynı seed + aynı [boş] exclude → deterministik).
    const mediumWithoutExclusion = generateWithRetries({
      difficulty: 'medium', bank, seed: seedFor(date, 'medium', baseSeed), exclude: new Set(),
    });
    const words = mediumWithoutExclusion.words.map((w) => w.word);
    const eligible = words.filter((w) => {
      const e = bank.find((x) => x.word === w);
      return e && e.word.length >= 5 && e.word.length <= 6 && [1, 2].includes(e.difficulty);
    });
    expect(eligible.length).toBeGreaterThan(0); // test kurulumu varsayımı: uygun bir aday var
    const bait = [...eligible].sort((a, b) => b.length - a.length)[0];
    const baitEntry = bank.find((e) => e.word === bait)!;

    // 2) "bait" kelimesini kesinlikle içeren gerçek bir easy bulmacası üret. `bait`
    // pool'daki EN UZUN kelime olacak şekilde fillers'ı bait'ten kısa tutuyoruz;
    // generatePuzzle ilk kelimeyi her zaman "havuzdaki en uzun" olarak seçtiğinden
    // (bkz. generator.ts) bait'in yerleşimi RNG'den bağımsız olarak garanti edilir.
    const sharedPool = bank.filter((e) => e.difficulty === 1 && e.word.length <= 6);
    const fillerEntries = sharedPool.filter((e) => e.word !== bait && e.word.length < bait.length);
    const persistedEasyBank = [baitEntry, ...fillerEntries.slice(0, 60)];
    const persistedEasy = generateWithRetries({ difficulty: 'easy', bank: persistedEasyBank, seed: 777 });
    expect(persistedEasy.words.map((w) => w.word)).toContain(bait);

    // 3) Bunu, önceki (yarım kalmış) bir run'ın zaten commit ettiği satır gibi elle
    // veritabanına ekle — assignPuzzles'ı hiç çağırmadan, tıpkı crash senaryosunda
    // olduğu gibi.
    const db = await createTestDb();
    await db.insert(puzzles).values(await buildPuzzleRow(persistedEasy, date, 'easy'));

    // 4) Devam eden run: easy zaten var olduğu için atlanır (skipped), medium+hard
    // sıfırdan üretilir.
    const result = await assignPuzzles(db, { bank, startDate: date, days: 1, baseSeed });
    expect(result).toEqual({ created: 2, skipped: 1 });

    const rows = await db.select().from(puzzles).where(eq(puzzles.date, date));
    const easyWords = new Set(rows.find((r) => r.difficulty === 'easy')!.words as string[]);
    const mediumWords = rows.find((r) => r.difficulty === 'medium')!.words as string[];
    const hardWords = rows.find((r) => r.difficulty === 'hard')!.words as string[];

    for (const w of mediumWords) expect(easyWords.has(w)).toBe(false);
    for (const w of hardWords) expect(easyWords.has(w)).toBe(false);

    // regresyon kanıtı: `bait`, düzeltilmemiş koddaki (exclude'suz) medium
    // üretiminin sonucundaydı (yukarıda deterministik olarak doğrulandı) ve
    // persistedEasy'nin kelimelerinden biri de `bait`tir. Yani eski kod bu
    // senaryoda `bait`i hem easy'de (önceki run) hem medium'da (bu run) üretip
    // aynı gün içinde zorunlu bir kelime tekrarına yol açardı. Düzeltilmiş kod
    // ise persisted satırın kelimelerini `sameDay`e tohumladığı için `bait`i
    // medium'un havuzundan tamamen çıkarır.
    expect(mediumWords).not.toContain(bait);
  });
});
