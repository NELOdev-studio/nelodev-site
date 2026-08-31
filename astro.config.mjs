import { defineConfig } from 'astro/config';

// Static one-page site. No integrations, no client runtime.
// site is used for absolute URL generation only; canonical and OG URLs
// are written explicitly in the page head.
export default defineConfig({
  site: 'https://nelodev.ee',
  compressHTML: true,
});
