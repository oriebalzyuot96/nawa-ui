import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.{js,mjs}'],
    environment: 'node',
    // build.test.mjs runs the generator in a temp copy, which takes a moment on Windows.
    testTimeout: 30000,
  },
});
