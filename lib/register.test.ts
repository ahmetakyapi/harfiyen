import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/tests/helpers/testDb';
import { USERNAME_RE, checkCredentials, registerUser } from './register';
import { normalizeUsername } from './tr';

describe('registerUser', () => {
  it('geçerli kayıt oluşturur ve şifre düz metin saklanmaz', async () => {
    const db = await createTestDb();
    const r = await registerUser(db, 'ahmet_1', 'gizli-sifre-1');
    expect(r.ok).toBe(true);
    expect(await checkCredentials(db, 'ahmet_1', 'gizli-sifre-1')).toMatchObject({ username: 'ahmet_1' });
    expect(await checkCredentials(db, 'ahmet_1', 'yanlis')).toBeNull();
  });
  it('alınmış kullanıcı adını reddeder', async () => {
    const db = await createTestDb();
    await registerUser(db, 'ahmet_1', 'gizli-sifre-1');
    const r = await registerUser(db, 'ahmet_1', 'baska-sifre');
    expect(r).toMatchObject({ ok: false });
  });
  it('geçersiz kullanıcı adlarını ve kısa şifreyi reddeder', async () => {
    const db = await createTestDb();
    expect((await registerUser(db, 'Ahmet', 'gizli-sifre-1')).ok).toBe(false);   // büyük harf
    expect((await registerUser(db, 'ab', 'gizli-sifre-1')).ok).toBe(false);      // kısa
    expect((await registerUser(db, 'ahmet akyapı', 'gizli-sifre-1')).ok).toBe(false); // boşluk/tr harf
    expect((await registerUser(db, 'ahmet_1', 'kisa')).ok).toBe(false);          // şifre < 8
  });
});

describe('normalizeUsername', () => {
  it("Türkçe büyük I ve İ'yi ASCII i'ye indirger", () => {
    // toLocaleLowerCase('tr-TR') 'I' → 'ı' üretiyor ve USERNAME_RE bunu
    // reddediyordu: "Islam" yazan oyuncu KALICI olarak kilitleniyordu.
    expect(normalizeUsername('Islam')).toBe('islam');
    expect(normalizeUsername('İSLAM')).toBe('islam');
    expect(normalizeUsername('ILKER')).toBe('ilker');
  });
  it('baştaki/sondaki boşlukları atar', () => {
    // Kayıt ucu trim ediyor, giriş ucu etmiyordu: aynı hesap iki farklı ada
    // düşüyordu.
    expect(normalizeUsername('  ahmet  ')).toBe('ahmet');
  });
  it('birleşik nokta imi bırakmaz', () => {
    expect(normalizeUsername('İ')).toBe('i');
    expect([...normalizeUsername('İzmir')]).toEqual([...'izmir']);
  });
  it('normalize edilmiş ad regexi geçer', () => {
    expect(USERNAME_RE.test(normalizeUsername('Ilker_42'))).toBe(true);
  });
});

describe('registerUser — kenar durumlar', () => {
  it('Türkçe harf içeren adda ayrı bir mesaj verir', async () => {
    const db = await createTestDb();
    const r = await registerUser(db, 'çağrı', 'uzunsifre1');
    expect(r).toEqual({ ok: false, error: expect.stringContaining('Türkçe harf') });
  });
  it('çok yaygın şifreyi reddeder', async () => {
    const db = await createTestDb();
    const r = await registerUser(db, 'deneme', 'password');
    expect(r.ok).toBe(false);
  });
});
