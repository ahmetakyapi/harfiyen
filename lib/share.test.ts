import { describe, expect, it } from 'vitest';
import { buildShareText, formatDuration } from './share';

describe('formatDuration', () => {
  it('dakika:saniye biçimler', () => {
    expect(formatDuration(87_000)).toBe('1:27');
    expect(formatDuration(5_000)).toBe('0:05');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
  });
});

describe('buildShareText', () => {
  it('spoiler içermeyen paylaşım metni üretir', () => {
    const text = buildShareText({ number: 42, difficulty: 'hard', durationMs: 134_000, rank: 12 });
    expect(text).toBe('Harfiyen #42 · Zor · ⏱ 2:14 · 🏅 12.\nharfiyen.vercel.app');
    const noRank = buildShareText({ number: 42, difficulty: 'easy', durationMs: 61_000 });
    expect(noRank).toBe('Harfiyen #42 · Kolay · ⏱ 1:01\nharfiyen.vercel.app');
  });
});
