import { Suspense } from 'react'; // <--- Importante
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import { useAuth } from './hooks/useAuth';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import { SEO } from './components/SEO';

// Componente de Carregamento Simples
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

// Componente de Rota Protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      {/* O Suspense evita que o site trave enquanto troca de idioma */}
      <Suspense fallback={<LoadingScreen />}>
        <SEO /> 
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
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
          
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="/book/:userId" element={<BookingPage />} />
          <Route path="/:slug" element={<BookingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;