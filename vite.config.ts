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
        name: 'Cleverya - Gestão Inteligente',
        short_name: 'Cleverya',
        description: 'Seu tempo, organizado com inteligência.',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
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
  // --- OTIMIZAÇÃO DE BUILD ---
  build: {
    // Aumenta o limite de aviso de tamanho de chunk (opcional, para limpar o terminal)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 1. Separa o React e Router (Bibliotecas Core)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // 2. Separa o Supabase (Pesado)
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // 3. Separa bibliotecas de UI (Lucide, Recharts, Radix)
          if (id.includes('lucide') || id.includes('recharts') || id.includes('@radix-ui')) {
            return 'vendor-ui';
          }
          // 4. Todo o resto da node_modules vai para um pacote genérico
          if (id.includes('node_modules')) {
            return 'vendor-libs';
          }
        },
      },
    },
    // Minimiza CSS e remove duplicidades
    cssCodeSplit: true,
    minify: 'esbuild', 
  },
});