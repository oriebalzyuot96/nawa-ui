import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Deployed to GitHub Pages at https://oriebalzyuot96.github.io/pelagic-ui/
export default defineConfig({
  site: 'https://oriebalzyuot96.github.io',
  base: '/pelagic-ui',
  trailingSlash: 'always',
  // three.js (~550 KB) is a lazily imported chunk used only by the 3D page's WebGL demos.
  vite: { build: { chunkSizeWarningLimit: 700 } },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar' } },
    }),
  ],
});
