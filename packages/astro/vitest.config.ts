/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

// getViteConfig adds Astro's compiler so .astro components can be imported and rendered
// with the experimental container API.
export default getViteConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
