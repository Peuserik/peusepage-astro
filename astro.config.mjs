// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://atro.peuserik.de',
  base: '/peusepage-astro',
  integrations: [svelte()],
  output: 'static',
});