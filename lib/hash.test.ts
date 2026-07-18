import { describe, expect, it } from 'vitest';
import { sha256Hex, wordHash } from './hash';

describe('sha256Hex', () => {
  it('bilinen vektörü üretir', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
  it('Türkçe karakterleri UTF-8 olarak hash\'ler (deterministik)', async () => {
    const a = await sha256Hex('ÇĞİIÖŞÜ');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex('ÇĞİIÖŞÜ')).toBe(a);
  });
});

describe('wordHash', () => {
  it('publicId, no, yön ve cevabı ayraçla birleştirir', async () => {
    expect(await wordHash('pid1', 3, 'across', 'KALEM')).toBe(await sha256Hex('pid1:3:across:KALEM'));
    expect(await wordHash('pid1', 3, 'down', 'KALEM')).not.toBe(await wordHash('pid1', 3, 'across', 'KALEM'));
  });
});
