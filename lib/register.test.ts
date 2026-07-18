import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/tests/helpers/testDb';
import { checkCredentials, registerUser } from './register';

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
