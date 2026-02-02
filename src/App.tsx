import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SEO } from './components/SEO';
import ReactGA from "react-ga4"; 

// --- MUDANÇA CRÍTICA: Importação Estática ---
// Removemos o 'lazy' DAQUI para eliminar o spinner/tela branca inicial.
// Como já otimizamos as imagens e o Analytics, isso agora será instantâneo.
import LandingPage from './pages/LandingPage';

// As outras páginas continuam Lazy para não pesar o carregamento inicial
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookingPage = lazy(() => import('./pages/BookingPage')); 
const NotFound = lazy(() => import('./pages/NotFound'));

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

function RouteChangeTracker() {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Mantemos o atraso do Analytics para proteger o LCP
    const timer = setTimeout(() => {
      ReactGA.initialize("G-8ZJYEN9K17", {
        gtagOptions: { send_page_view: false }
      });
      setIsInitialized(true);
    }, 4000); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }
  }, [location, isInitialized]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      {/* Removemos o Suspense global para a rota principal não travar */}
      <SEO /> 
      <RouteChangeTracker />
      
      <Routes>
        {/* Rota da Home agora carrega direto (sem Suspense) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* As outras rotas usam Suspense individualmente */}
        <Route path="/login" element={<Suspense fallback={<LoadingScreen />}><LoginPage /></Suspense>} />
        <Route path="/signup" element={<Suspense fallback={<LoadingScreen />}><SignupPage /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<LoadingScreen />}><Terms /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<LoadingScreen />}><Privacy /></Suspense>} />

        <Route path="/book/:userId" element={<Suspense fallback={<LoadingScreen />}><BookingPage /></Suspense>} />
        <Route path="/:slug" element={<Suspense fallback={<LoadingScreen />}><BookingPage /></Suspense>} />

        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </Suspense>
        } />

        <Route path="/success" element={
          <Suspense fallback={<LoadingScreen />}>
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          </Suspense>
        } />
        
        <Route path="*" element={<Suspense fallback={<LoadingScreen />}><NotFound /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;