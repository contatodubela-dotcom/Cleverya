import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Cleverya',
        short_name: 'Cleverya',
        description: 'Gestão Inteligente',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext', // Otimização para navegadores modernos (mais rápido)
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. ISOLAR O MONSTRO: Recharts (Gráficos) pesa muito. Só deve carregar no Dashboard.
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }

          // 2. ISOLAR ANIMAÇÕES: Framer Motion é pesado.
          if (id.includes('framer-motion')) {
            return 'vendor-animation';
          }

          // 3. ISOLAR UI KITS: Radix e componentes visuais complexos
          if (id.includes('@radix-ui') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'vendor-ui-libs';
          }

          // 4. ÍCONES LEVES: Lucide é leve, pode ficar separado para carregar rápido no Login
          if (id.includes('lucide')) {
            return 'vendor-icons';
          }

          // 5. CORE DO REACT: O motor principal
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react-core';
          }
          
          // 6. BACKEND: Supabase e TanStack Query
          if (id.includes('@supabase') || id.includes('@tanstack')) {
            return 'vendor-backend';
          }
        },
      },
    },
  },
});