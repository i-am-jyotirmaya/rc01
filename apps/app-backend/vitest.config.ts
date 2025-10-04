import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@codebattle/db': resolve(__dirname, '../../packages/db/src'),
    },
  },
});
