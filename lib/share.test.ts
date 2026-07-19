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
  it('spoiler içermeyen, Wordle-tarzı renkli-zorluk paylaşım metni üretir', () => {
    const text = buildShareText({ number: 42, difficulty: 'hard', durationMs: 134_000, rank: 12, hintCount: 1 });
    expect(text).toBe(
      '🧩 Harfiyen #42 · 🔴 Zor\n⏱ 2:14 · 🏅 12. sıra\n💡 1 ipucu\n\nharfiyen.vercel.app',
    );
  });
  it('sıra ve ipucu olmadan da doğru biçimlenir', () => {
    const text = buildShareText({ number: 42, difficulty: 'easy', durationMs: 61_000 });
    expect(text).toBe('🧩 Harfiyen #42 · 🟢 Kolay\n⏱ 1:01\n\nharfiyen.vercel.app');
  });
  it('cevap/kelime içeriği asla üretilen metinde yer almaz', () => {
    const text = buildShareText({ number: 1, difficulty: 'medium', durationMs: 10_000, rank: 1, hintCount: 3 });
    // fonksiyon yalnızca number/difficulty/durationMs/rank/hintCount alır —
    // bulmaca cevaplarına erişimi bile yok, bu test o sözleşmeyi belgeler.
    expect(text).not.toMatch(/[A-ZÇĞİÖŞÜ]{3,}/);
  });
});
