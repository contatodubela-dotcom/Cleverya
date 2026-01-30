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

// --- POSTHOG OTIMIZADO (DELAY) ---
// Carrega o gravador apenas 3 segundos APÓS o site abrir para não travar o mobile
if (typeof window !== 'undefined') {
  setTimeout(() => {
    posthog.init('phc_xZtmAqykzTZZPmzIGL7ODp3nLbhsgKcwLIolcowrOb8', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only', 
      capture_pageview: false,
      // Desativa gravação automática de texto para economizar processamento
      mask_all_text: true, 
      mask_all_element_attributes: true
    });
  }, 3000); // Espera 3000ms (3 segundos)
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