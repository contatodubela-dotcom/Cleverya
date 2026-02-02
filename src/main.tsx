import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';

// --- OTIMIZAÇÃO DE PERFORMANCE (PRE-FETCH) ---
// Inicia o download da Landing Page em paralelo com a inicialização do React.
// Isso elimina o "gap" de tempo do Lazy Loading.
import('./pages/LandingPage');

// --- POSTHOG OTIMIZADO ---
if (typeof window !== 'undefined') {
  setTimeout(() => {
    import('posthog-js').then(({ default: posthog }) => {
        if (!(window as any).posthog) { 
            posthog.init('phc_xZtmAqykzTZZPmzIGL7ODp3nLbhsgKcwLIolcowrOb8', {
              api_host: 'https://us.i.posthog.com',
              person_profiles: 'identified_only', 
              capture_pageview: false,
              mask_all_text: true, 
              mask_all_element_attributes: true,
              persistence: 'localStorage' 
            });
        }
    }).catch(err => console.log('PostHog load blocked', err));
  }, 5000);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);