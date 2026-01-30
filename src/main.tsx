import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from 'sonner';
import posthog from 'posthog-js';
import { HelmetProvider } from 'react-helmet-async';
import ReactGA from "react-ga4";

// --- GOOGLE ANALYTICS ---
ReactGA.initialize("G-8ZJYEN9K17"); 

// --- POSTHOG OTIMIZADO (SUPER DELAY) ---
if (typeof window !== 'undefined') {
  // Aumentamos para 8000ms (8 segundos) para garantir performance total no LCP
  setTimeout(() => {
    // CORREÇÃO AQUI: Usamos (window as any) para o TypeScript não reclamar
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
  }, 8000); 
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