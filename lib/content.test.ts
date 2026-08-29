import { describe, expect, it } from 'vitest';
import { loadBank, validateBank } from './content';

describe('validateBank', () => {
  it('geçersiz kelimeyi (alfabe dışı / kısa) reddeder', () => {
    expect(() => validateBank([{ word: 'TAXİ', clues: ['x'], difficulty: 1 }])).toThrow();
    expect(() => validateBank([{ word: 'AŞ', clues: ['x'], difficulty: 1 }])).toThrow();
  });
  it('küçük harfli kelimeyi reddeder (banka her zaman büyük harf tutar)', () => {
    expect(() => validateBank([{ word: 'kalem', clues: ['x'], difficulty: 1 }])).toThrow();
  });
  it('ipucusuz veya difficulty aralık dışı girdiyi reddeder', () => {
    expect(() => validateBank([{ word: 'KALEM', clues: [], difficulty: 1 }])).toThrow();
    expect(() => validateBank([{ word: 'KALEM', clues: ['x'], difficulty: 4 }])).toThrow();
  });
  it('tekrar eden kelimeyi reddeder', () => {
    const e = { word: 'KALEM', clues: ['xyz', 'abc'], difficulty: 1 };
    expect(() => validateBank([e, e])).toThrow(/tekrar/i);
  });
});

describe('loadBank (gerçek dosya)', () => {
  it('en az 900 geçerli girdi içerir', () => {
    expect(loadBank().length).toBeGreaterThanOrEqual(900);
  });
  it('zorluk dağılımı: 1 için ≥270, 2 için ≥330, 3 için ≥180', () => {
    const bank = loadBank();
    expect(bank.filter((e) => e.difficulty === 1).length).toBeGreaterThanOrEqual(270);
    expect(bank.filter((e) => e.difficulty === 2).length).toBeGreaterThanOrEqual(330);
    expect(bank.filter((e) => e.difficulty === 3).length).toBeGreaterThanOrEqual(180);
  });
  it('kısa kelime havuzu geniştir (3-4 harf ≥ 180 adet)', () => {
    expect(loadBank().filter((e) => e.word.length <= 4).length).toBeGreaterThanOrEqual(180);
  });
  it('uzun kelimeler vardır (8+ harf ≥ 90 adet)', () => {
    expect(loadBank().filter((e) => e.word.length >= 8).length).toBeGreaterThanOrEqual(90);
  });
  it('kelimelerin en az yarısında 2+ ipucu varyantı vardır', () => {
    const bank = loadBank();
    expect(bank.filter((e) => e.clues.length >= 2).length).toBeGreaterThanOrEqual(bank.length / 2);
  });

  // ——— İpucu kalitesi: aynı soruyu iki kez görmemek için ———

  it('aynı ipucu metni iki FARKLI kelimede kullanılmaz', () => {
    // Gerçek bir veri hatasıydı: ÇİM ve ÇİMEN birebir aynı ipucunu taşıyordu.
    // Aynı soru iki ayrı cevaba çıkınca oyuncu ipucuyu haklı olarak "yanlış"
    // sayar; kesişim harfleri de tutmazsa bulmaca çözülemez hâle gelir.
    const owner = new Map<string, string>();
    const collisions: string[] = [];
    for (const e of loadBank()) {
      for (const c of e.clues) {
        const key = c.toLocaleLowerCase('tr-TR').trim();
        const prev = owner.get(key);
        if (prev !== undefined && prev !== e.word) collisions.push(`"${c}" → ${prev} / ${e.word}`);
        owner.set(key, e.word);
      }
    }
    expect(collisions).toEqual([]);
  });

  it('bir kelimenin ipucu varyantları kendi içinde tekrar etmez', () => {
    const dups = loadBank()
      .filter((e) => new Set(e.clues).size !== e.clues.length)
      .map((e) => e.word);
    expect(dups).toEqual([]);
  });

  it('3 harfli kelimelerin hepsinde 3 ipucu varyantı vardır', () => {
    // 3 harflilerin havuzu en küçük olduğundan en sık tekrar edenler onlar.
    // Üçüncü varyant, kelime tekrar geldiğinde aynı sorunun çıkmasını önler.
    const thin = loadBank().filter((e) => e.word.length === 3 && e.clues.length < 3);
    expect(thin.map((e) => e.word)).toEqual([]);
  });

  it('ipuçları cevabı ayrı bir sözcük olarak içermez', () => {
    // "KALEM: Kalem ne işe yarar?" tarzı sızıntı bulmacayı anlamsız kılar.
    // Sınır kontrolü şart: düz alt dize araması "KAN"ı "yaralanınca AKAN"
    // içinde yakalayıp yanlış alarm veriyordu. Gövde sızıntısı (NAL/nalbant)
    // sondan eklemeli bir dilde makineyle güvenilir biçimde ayırt edilemez —
    // onu bu test değil, ipucu yazarken göz yakalar.
    const leaks = loadBank()
      .filter((e) => {
        const re = new RegExp(`(?<!\\p{L})${e.word}(?!\\p{L})`, 'u');
        return e.clues.some((c) => re.test(c.toLocaleUpperCase('tr-TR')));
      })
      .map((e) => e.word);
    expect(leaks).toEqual([]);
  });
});

describe('ipucu kalitesi — bankanın tamamı', () => {
  const bank = loadBank();
  const low = (s: string): string => s.toLocaleLowerCase('tr-TR');
  // Türkçe eklemeli olduğu için "ayrı sözcük" araması yetmiyor: KALECİ'nin
  // "Kalede topu tutan oyuncu" ipucunda cevap sözcük olarak geçmiyor ama
  // gövdesi geçiyor ve kelimeyi fiilen veriyor.
  const stem = (w: string): string => low(w).slice(0, Math.max(4, w.length - 2));

  it('hiçbir ipucu cevabın gövdesini içermez', () => {
    const leaks: string[] = [];
    for (const e of bank) {
      const st = stem(e.word);
      if (st.length < 4) continue;
      for (const c of e.clues) if (low(c).includes(st)) leaks.push(`${e.word}: ${c}`);
    }
    expect(leaks).toEqual([]);
  });

  it('her kelimenin en az üç ipucu varyantı vardır', () => {
    // Varyant sayısı tekrar hissini belirliyor: 60 günlük simülasyonda iki
    // varyantla yerleşimlerin %21'i daha önce görülen ipucuyla dönüyordu.
    const few = bank.filter((e) => e.clues.length < 3).map((e) => e.word);
    expect(few).toEqual([]);
  });

  it('aynı ipucu iki farklı kelimede kullanılmaz', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const e of bank) {
      for (const c of e.clues) {
        const key = low(c);
        const owner = seen.get(key);
        if (owner !== undefined && owner !== e.word) clashes.push(`${owner} ≡ ${e.word}: ${c}`);
        seen.set(key, e.word);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('düzeltme işaretli yazımlar tutarlıdır', () => {
    // "Modern gazete" tonunda aynı sözcüğün iki yazımı gözle görünür bir kusur.
    const inconsistent: string[] = [];
    for (const e of bank) {
      for (const c of e.clues) {
        if (/\b(hali|halinde|haline|kagit|ruzgar)\b/i.test(c)) inconsistent.push(`${e.word}: ${c}`);
      }
    }
    expect(inconsistent).toEqual([]);
  });
});
