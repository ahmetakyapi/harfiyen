import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'hooks/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    // Üreteç testleri hesap yoğun: her biri onlarca bulmaca üretiyor ve CI
    // runner'ları geliştirme makinesinden 2-3 kat yavaş. 30 sn'lik eski sınır
    // assign.test.ts'i CI'da kıl payı aşıyordu (yerelde 8 sn ölçüldü).
    testTimeout: 60000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
});
