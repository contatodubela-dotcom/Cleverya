import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SEO } from './components/SEO';
import ReactGA from "react-ga4"; // Importação direta e leve

// --- LAZY IMPORTS ---
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookingPage = lazy(() => import('./pages/BookingPage')); 
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// TELA DE CARREGAMENTO (MANTIDA)
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

// ROTA PROTEGIDA (MANTIDA)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

// --- NOVO RASTREADOR OTIMIZADO (Substitui o componente pesado) ---
// Este componente apenas observa a mudança de rota e avisa o GA4, sem carregar scripts extras.
function RouteChangeTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Envia o pageview apenas quando a rota muda
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return null;
}

function App() {
  return (
    // REMOVIDO: HelmetProvider (já existe no main.tsx)
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <SEO /> 
        
        {/* Componente leve que criamos acima */}
        <RouteChangeTracker />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="/book/:userId" element={<BookingPage />} />
          <Route path="/:slug" element={<BookingPage />} />

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
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;