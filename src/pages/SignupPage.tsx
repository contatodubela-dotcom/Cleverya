import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ⚠️ ATENÇÃO: ESTES SÃO LINKS DE TESTE (Modo Dev).
// QUANDO FOR VENDER DE VERDADE, TROQUE PELOS LINKS DE PRODUÇÃO DO STRIPE.
const STRIPE_LINKS = {
  pro: {
    monthly: {
      pt: 'https://buy.stripe.com/test_8x2eVfb7rg1A93E6qa3gk00',
      en: 'https://buy.stripe.com/test_8x2bJ36RbaHgdjUbKu3gk01'
    },
    yearly: {
      pt: 'https://buy.stripe.com/test_4gM5kFcbvg1AdjU5m63gk04',
      en: 'https://buy.stripe.com/test_dRm8wR0sNaHg6Vw15Q3gk05'
    }
  },
  business: {
    monthly: {
      pt: 'https://buy.stripe.com/test_dRm6oJ6Rb2aK1Bcg0K3gk03',
      en: 'https://buy.stripe.com/test_fZueVfejD8z82FgcOy3gk02'
    },
    yearly: {
      pt: 'https://buy.stripe.com/test_cNi6oJ4J34iS93EaGq3gk07',
      en: 'https://buy.stripe.com/test_eVqaEZdfz8z80x8dSC3gk06'
    }
  }
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') 
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/\s+/g, '-') 
      .replace(/[^\w-]+/g, '') 
      .replace(/--+/g, '-') 
      .replace(/^-+/, '') 
      .replace(/-+$/, ''); 
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const planIntent = searchParams.get('plan');
    const cycleIntent = searchParams.get('cycle') as 'monthly' | 'yearly' || 'monthly';
    const currentLang = i18n.language.startsWith('pt') ? 'pt' : 'en';

    const slug = generateSlug(businessName) + '-' + Math.floor(Math.random() * 10000);

    try {
      console.log("1. Criando usuário no Auth...");
      // 1. Cria o Usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { business_name: businessName, slug: slug } 
        },
      });

      if (authError) throw authError;
      
      if (authData.user) {
          // --- RASTREIO DO FACEBOOK PIXEL ---
          if ((window as any).fbq) {
            (window as any).fbq('track', 'CompleteRegistration', {
              content_name: planIntent || 'free_signup',
              status: 'success'
            }); 
            console.log("Pixel de Cadastro Disparado!");
          }

          const userId = authData.user.id;
          console.log("2. Usuário criado com ID:", userId);

          // 2. CRIAÇÃO MANUAL DA EMPRESA
          console.log("3. Inserindo empresa manualmente...");
          
          const { data: newBiz, error: bizError } = await supabase
            .from('businesses')
            .insert({
                owner_id: userId,
                name: businessName,
                slug: slug,
                plan_type: 'free', // Começa como Free
                subscription_status: 'active'
            })
            .select()
            .single();

          if (bizError) {
             console.error("Erro ao inserir empresa:", bizError);
             if (bizError.code !== '23505') throw bizError;
          }

          // Vincula membro
          if (newBiz || !bizError) {
             const businessId = newBiz?.id || (await supabase.from('businesses').select('id').eq('owner_id', userId).single()).data?.id;

             if (businessId) {
                 console.log("4. Vinculando membro dono...");
                 const { error: memberError } = await supabase
                    .from('business_members')
                    .insert({
                        user_id: userId,
                        business_id: businessId,
                        role: 'owner'
                    });
                
                 if (memberError && memberError.code !== '23505') console.error("Erro ao criar membro:", memberError);
             }
          }

          // --- NOVO: DISPARAR E-MAIL DE BOAS-VINDAS ---
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: email,
                subject: 'Bem-vindo ao Cleverya! 🚀',
                clientName: businessName,
                type: 'welcome_business'
              }
            });
          } catch (err) {
            console.error("Erro ao enviar email de boas-vindas", err);
          }

          // --- LÓGICA DE REDIRECIONAMENTO PARA PAGAMENTO ---
          if (planIntent && STRIPE_LINKS[planIntent as keyof typeof STRIPE_LINKS]) {
              const planLinks = STRIPE_LINKS[planIntent as keyof typeof STRIPE_LINKS];
              const cycleLinks = planLinks[cycleIntent];
              const redirectUrl = cycleLinks[currentLang];

              if (redirectUrl) {
                  toast.success(
                      currentLang === 'pt' 
                      ? 'Conta criada! Redirecionando para pagamento...' 
                      : 'Account created! Redirecting to payment...'
                  );
                  
                  // Monta URL com ID do usuário para o Webhook identificar depois
                  const finalCheckoutUrl = `${redirectUrl}?client_reference_id=${userId}&prefilled_email=${encodeURIComponent(email)}`;
                  
                  setTimeout(() => {
                      window.location.href = finalCheckoutUrl;
                  }, 1500);
                  
                  return; // Para a execução aqui
              }
          }
      }

      // Fluxo padrão (sem plano selecionado ou erro no redirecionamento)
      setSuccess(true);
      toast.success(i18n.language === 'pt' ? 'Conta criada com sucesso!' : 'Account created successfully!');
      
    } catch (error: any) {
      console.error("Erro fatal no cadastro:", error);
      toast.error(error.message || t('auth.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
       <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

       <div className="absolute top-4 right-4 z-20">
         <button onClick={toggleLanguage} className="text-white/50 hover:text-white text-sm font-bold border border-white/10 rounded-lg px-3 py-1.5 transition">
            {i18n.language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
         </button>
       </div>

      <div className="w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {!success && (
            <Link to="/" className="inline-flex items-center text-gray-500 hover:text-white text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back_home')}
            </Link>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-sans font-bold text-white mb-2">
            {t('auth.signup_title')}
          </h1>
          <p className="text-gray-400 text-sm">{t('auth.signup_subtitle')}</p>
        </div>

        {success ? (
          <div className="text-center animate-fade-in py-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-xl text-white mb-2">{t('auth.signup_success_title')}</h3>
            <p className="text-sm text-gray-400 mb-6">
              {t('auth.signup_success_msg')} <br/><strong className="text-white">{email}</strong>.
            </p>
            <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5" onClick={() => navigate('/login')}>
              {t('auth.btn_back_login')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_business')}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t('auth.placeholder_business')}
                required
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">{t('auth.label_password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.placeholder_password')}
                required
                minLength={6}
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-gray-700 text-white placeholder-gray-600 focus:border-primary focus:ring-0 transition-all py-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold h-11 rounded-lg mt-2"
              disabled={loading}
            >
              {loading ? t('auth.btn_loading') : t('auth.btn_signup')}
            </Button>

            <p className="text-center mt-6 text-sm text-gray-500">
              {t('auth.link_have_account').split('?')[0]}?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-white transition-colors">
                {t('auth.btn_login')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}