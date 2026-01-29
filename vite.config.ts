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
  // --- ADIÇÃO CRÍTICA PARA PERFORMANCE ---
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa o motor do React (carrega apenas uma vez)
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Separa a biblioteca de animação (que é pesada)
          animations: ['framer-motion'],
          // Separa utilitários e ícones
          utils: ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge'],
          // Separa o cliente do banco de dados
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Minificação agressiva para reduzir tamanho
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true
      }
    }
  }
});