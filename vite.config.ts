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
    target: 'esnext', // Otimiza para navegadores modernos (mais leve)
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: true, // Remove console.log em produção
            drop_debugger: true
        }
    },
    rollupOptions: {
      output: {
        // --- CACHE BUSTING (O SEGREDO) ---
        // Adiciona um timestamp único ao nome dos arquivos para forçar o Cloudflare a atualizar
        entryFileNames: `assets/[name].[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name].[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name].[hash]-${Date.now()}.[ext]`,

        manualChunks: {
          // SEPARAÇÃO INTELIGENTE DE PACOTES
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'animations': ['framer-motion'], // Isola a biblioteca pesada de animação
          'supabase': ['@supabase/supabase-js'], // Isola o banco de dados
          'ui-libs': ['lucide-react', 'date-fns', 'clsx', 'tailwind-merge'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector']
        }
      }
    }
  }
});