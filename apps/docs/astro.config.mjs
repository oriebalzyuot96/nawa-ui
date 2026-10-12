import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Deployed to GitHub Pages at https://oriieebgsmile96.github.io/nawa-ui/
export default defineConfig({
  site: 'https://oriieebgsmile96.github.io',
  base: '/nawa-ui',
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar' } },
    }),
  ],
});
