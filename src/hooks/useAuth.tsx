import {
  useContext,
  useState,
  useEffect,
  createContext,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface UserWithSubscription extends User {
  subscription_status?: string;
  plan_type?: string;
}

interface AuthContextType {
  session: Session | null;
  user: UserWithSubscription | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const enrichUser = useCallback(async (currentUser: User) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (memberError || !memberData) {
        console.warn('Usuário sem empresa vinculada:', memberError);
        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('plan_type, subscription_status')
        .eq('id', memberData.business_id)
        .maybeSingle();

      if (businessError) {
        console.warn('Erro ao buscar dados da empresa:', businessError);
        return;
      }

      setUser({
        ...currentUser,
        subscription_status:
          businessData?.subscription_status || 'active',
        plan_type:
          businessData?.plan_type || 'free',
      });
    } catch (error: unknown) {
      console.error('Erro ao enriquecer usuário:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Libera imediatamente o usuário autenticado.
      setUser({
        ...nextSession.user,
        subscription_status: 'active',
        plan_type: 'free',
      });

      setLoading(false);

      // Busca plano/assinatura depois, sem bloquear login/dashboard.
      setTimeout(() => {
        if (!mounted) return;
        void enrichUser(nextSession.user);
      }, 0);
    };

    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        applySession(initialSession);
      } catch (error: unknown) {
        console.error('Erro ao carregar sessão inicial:', error);

        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [enrichUser]);

  const logout = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setUser(null);
    setLoading(false);

    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};