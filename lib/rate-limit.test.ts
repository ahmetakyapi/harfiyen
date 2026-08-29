import { beforeEach, describe, expect, it } from 'vitest';
import { limit, resetLimits } from './rate-limit';

describe('limit', () => {
  beforeEach(() => resetLimits());

  it('pencere içinde en fazla max isteğe izin verir', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(limit('a', 3, 60_000, t0 + i).ok).toBe(true);
    }
    const over = limit('a', 3, 60_000, t0 + 10);
    expect(over.ok).toBe(false);
    expect(over.retryAfterSec).toBeGreaterThan(0);
  });

  it('pencere dolunca sayaç sıfırlanır', () => {
    const t0 = 1_000_000;
    expect(limit('b', 1, 1_000, t0).ok).toBe(true);
    expect(limit('b', 1, 1_000, t0 + 500).ok).toBe(false);
    expect(limit('b', 1, 1_000, t0 + 1_500).ok).toBe(true);
  });

  it('anahtarlar birbirinden bağımsızdır', () => {
    const t0 = 1_000_000;
    expect(limit('c', 1, 1_000, t0).ok).toBe(true);
    expect(limit('d', 1, 1_000, t0).ok).toBe(true);
  });
});
