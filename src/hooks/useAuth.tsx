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

  const fetchUserStatus = useCallback(async (currentUser: User) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (memberError || !memberData) {
        console.warn('Usuário sem empresa vinculada:', memberError);

        setUser({
          ...currentUser,
          subscription_status: 'active',
          plan_type: 'free',
        });

        return;
      }

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('plan_type, subscription_status')
        .eq('id', memberData.business_id)
        .maybeSingle();

      if (businessError) {
        console.warn('Erro ao buscar dados da empresa:', businessError);

        setUser({
          ...currentUser,
          subscription_status: 'active',
          plan_type: 'free',
        });

        return;
      }

      setUser({
        ...currentUser,
        subscription_status:
          businessData?.subscription_status || 'active',
        plan_type: businessData?.plan_type || 'free',
      });
    } catch (error: unknown) {
      console.error('Erro fatal no useAuth:', error);

      setUser({
        ...currentUser,
        subscription_status: 'active',
        plan_type: 'free',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession);

        if (initialSession?.user) {
          await fetchUserStatus(initialSession.user);
        } else {
          setUser(null);
          setLoading(false);
        }
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
      if (!mounted) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Executa fora do callback interno do Supabase Auth.
      setTimeout(() => {
        if (!mounted) return;
        void fetchUserStatus(nextSession.user);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserStatus]);

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