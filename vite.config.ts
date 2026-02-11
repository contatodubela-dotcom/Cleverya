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
      
      // --- A PARTE QUE FALTAVA ---
      workbox: {
        cleanupOutdatedCaches: true, // Deleta o cache da versão anterior
        clientsClaim: true, // Assume o controle da página imediatamente
        skipWaiting: true, // Não espera o usuário fechar todas as abas
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'] // Arquivos para cachear
      },
      // ---------------------------

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

        manualChunks: {
          'core-vendor': [
            'react', 'react-dom', 'react-router-dom', 
            'i18next', 'react-i18next', 'i18next-browser-languagedetector',
            'clsx', 'tailwind-merge', 'sonner', 'lucide-react'
          ],
          'animations': ['framer-motion'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
});