import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { SEO } from './components/SEO';
import ReactGA from "react-ga4"; 

// VOLTAMOS AO LAZY LOADING (Melhor para Speed Index e Mobile)
const LandingPage = lazy(() => import('./pages/LandingPage'));

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
      <Suspense fallback={<LoadingScreen />}>
        <SEO /> 
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