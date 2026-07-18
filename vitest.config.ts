import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'hooks/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
});
