import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages sirve el sitio bajo el nombre del repositorio.
const SITE_BASE = '/simulador-exil/';

export default defineConfig(() => ({
  base: SITE_BASE,
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      workbox: {
        // Cachear JS/CSS/HTML y el banco YAML incrustado en el bundle
        globPatterns: ['**/*.{js,css,html,ico,png,svg,yaml}'],
        runtimeCaching: [
          {
            // Cachear el banco.yaml en runtime (por si lo sirve Vite en dev)
            urlPattern: /banco\.yaml$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'banco-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'Simulador EXIL',
        short_name: 'SimEXIL',
        description: 'Simulador de examen EXIL-NEGOCIOS (CENEVAL)',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        // scope/start_url bajo la base del repositorio en GitHub Pages
        scope: SITE_BASE,
        start_url: SITE_BASE,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
}));
