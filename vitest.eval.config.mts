import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Load .env.local so evals can access API keys
try {
  const envLocal = readFileSync('.env.local', 'utf8');
  for (const line of envLocal.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {}

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    include: ['src/**/*.eval.ts'],
    testTimeout: 60_000,
    globals: true,
    reporters: process.env.LANGSMITH_API_KEY
      ? ['langsmith/vitest/reporter', 'default']
      : ['default'],
  },
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
});
