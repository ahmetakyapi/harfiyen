import { describe, expect, it } from 'vitest';
import { createTestDb } from '@/tests/helpers/testDb';
import { puzzles, users } from './schema';

describe('şema', () => {
  it('kullanıcı ekler ve username benzersizliğini uygular', async () => {
    const db = await createTestDb();
    await db.insert(users).values({ username: 'ahmet', passwordHash: 'x' });
    await expect(
      db.insert(users).values({ username: 'ahmet', passwordHash: 'y' }),
    ).rejects.toThrow();
  });

  it('aynı (date, difficulty) ikinci bulmacayı reddeder', async () => {
    const db = await createTestDb();
    const base = {
      date: '2026-07-21', difficulty: 'easy' as const, size: 6,
      black: [[false]], entries: [], solution: [[null]], wordHashes: {}, words: [],
    };
    await db.insert(puzzles).values({ ...base, publicId: 'a1' });
    await expect(db.insert(puzzles).values({ ...base, publicId: 'a2' })).rejects.toThrow();
  });
});
