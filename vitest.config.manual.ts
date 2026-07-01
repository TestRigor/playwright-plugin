import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/manual/**/*.test.ts'],
    testTimeout: 180_000,
    hookTimeout: 120_000,
  },
});
