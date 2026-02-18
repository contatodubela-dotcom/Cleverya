import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SEO } from './components/SEO';

// Componentes Carregados sob Demanda (Lazy)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookingPage = lazy(() => import('./pages/BookingPage')); 
const NotFound = lazy(() => import('./pages/NotFound'));

// Página de SEO Local
const LocalLandingPage = lazy(() => import('./pages/LocalLandingPage'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// Rastreador simples (sem dependência do GA4 para evitar erro)
function RouteChangeTracker() {
  const location = useLocation();
  useEffect(() => {
    // Log para debug (opcional)
    console.log("Rota alterada:", location.pathname);
  }, [location]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      {/* CORREÇÃO DO ERRO: 
        O <Suspense> agora envolve TUDO dentro do Router.
        Isso impede o erro "component suspended" se o SEO ou a tradução demorarem para carregar.
      */}
      <Suspense fallback={<LoadingScreen />}>
        <SEO /> 
        <RouteChangeTracker />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* ROTA DE SEO LOCAL */}
          <Route path="/solucoes/:profession/:city" element={<LocalLandingPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/success" element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          } />

          <Route path="/book/:userId" element={<BookingPage />} />
          <Route path="/:slug" element={<BookingPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;