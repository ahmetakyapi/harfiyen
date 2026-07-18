import { describe, expect, it } from 'vitest';
import { LAUNCH_DATE, addDays, formatTrtDate, gameDay, msUntilNextReset, puzzleNumber, trtDate } from './date';

describe('trtDate', () => {
  it('UTC 21:30 iken İstanbul ertesi gündedir', () => {
    expect(trtDate(new Date('2026-07-18T21:30:00Z'))).toBe('2026-07-19');
  });
  it('UTC 20:30 iken İstanbul aynı gündedir', () => {
    expect(trtDate(new Date('2026-07-18T20:30:00Z'))).toBe('2026-07-18');
  });
});

describe('gameDay', () => {
  it('TSİ 08:30 iken oyun günü hâlâ önceki gündür', () => {
    // 2026-07-18T05:30Z == TSİ 08:30
    expect(gameDay(new Date('2026-07-18T05:30:00Z'))).toBe('2026-07-17');
  });
  it('TSİ 09:00 ve sonrası yeni oyun günüdür', () => {
    expect(gameDay(new Date('2026-07-18T06:00:00Z'))).toBe('2026-07-18'); // TSİ 09:00
    expect(gameDay(new Date('2026-07-18T20:59:00Z'))).toBe('2026-07-18'); // TSİ 23:59
  });
});

describe('addDays', () => {
  it('ay ve yıl sınırlarını aşar', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('puzzleNumber', () => {
  it('lansman günü #1', () => {
    expect(puzzleNumber(LAUNCH_DATE)).toBe(1);
    expect(puzzleNumber(addDays(LAUNCH_DATE, 41))).toBe(42);
  });
});

describe('msUntilNextReset', () => {
  it('TSİ 08:00 iken 1 saat kalır', () => {
    // 2026-07-18T05:00Z == TSİ 08:00
    expect(msUntilNextReset(new Date('2026-07-18T05:00:00Z'))).toBe(60 * 60 * 1000);
  });
  it('TSİ 10:00 iken 23 saat kalır', () => {
    expect(msUntilNextReset(new Date('2026-07-18T07:00:00Z'))).toBe(23 * 60 * 60 * 1000);
  });
});

describe('formatTrtDate', () => {
  it('Türkçe uzun tarih üretir', () => {
    expect(formatTrtDate('2026-07-18')).toBe('18 Temmuz 2026');
  });
});
