import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
  resolve: {
    alias: {
      '@/': '/src/'
    }
  },

  optimizeDeps: {
    include: ['lightweight-charts']
  },

  plugins: [
    tailwindcss(),
  ]
},

  experimental: {
      svg: true,
	},

  integrations: [react()],
});
