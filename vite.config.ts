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
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: true,
            drop_debugger: true
        }
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,

        // ESTRATÉGIA FINAL: "The Big Three"
        // Em vez de fragmentar, criamos 3 pilares sólidos para reduzir requisições HTTP.
        manualChunks: {
          // 1. O motor do site (React + Router + Utils + i18n) - Tudo necessário para "ligar" o site
          'core-vendor': [
            'react', 'react-dom', 'react-router-dom', 
            'i18next', 'react-i18next', 'i18next-browser-languagedetector',
            'clsx', 'tailwind-merge', 'sonner', 'lucide-react'
            // date-fns removido daqui para ser carregado apenas quando necessário (Dashboard)
          ],
          
          // 2. O gigante de animação (só baixa depois do core)
          'animations': ['framer-motion'],
          
          // 3. O backend (pesado, mas necessário para Auth)
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
});