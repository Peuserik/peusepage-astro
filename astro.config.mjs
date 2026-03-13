// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://peuserik.github.io',
  base: '/peusepage-astro',
  integrations: [svelte()],
  output: 'static',
});