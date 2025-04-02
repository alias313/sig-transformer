import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '~/': '/src/'
      }
    },

    optimizeDeps: {
      include: ['lightweight-charts']
    },

    plugins: [tailwindcss()]
  }

});