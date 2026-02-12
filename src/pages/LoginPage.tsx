import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t, i18n } = useTranslation(); // Pegamos o i18n para trocar o idioma
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Schema de validação com tradução
  const loginSchema = z.object({
    email: z.string().email(t('auth.validation_email', { defaultValue: 'E-mail inválido' })),
    password: z.string().min(6, t('auth.validation_password_min', { defaultValue: 'A senha deve ter no mínimo 6 caracteres' })),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      let msg = t('auth.error_login_generic', { defaultValue: 'Erro ao entrar. Verifique suas credenciais.' });
      
      if (error.message.includes('Invalid login')) {
          msg = t('auth.error_login_invalid', { defaultValue: 'E-mail ou senha incorretos.' });
      }
      if (error.message.includes('Email not confirmed')) {
          msg = t('auth.error_login_unconfirmed', { defaultValue: 'E-mail não confirmado.' });
      }
      
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* SELETOR DE IDIOMA (NOVO) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 animate-in fade-in slide-in-from-top-4 duration-700">
         <button 
           onClick={() => i18n.changeLanguage('pt')} 
           className={`text-xs font-bold py-2 px-3 rounded-full transition-all border ${i18n.language === 'pt' ? 'bg-primary text-slate-900 border-primary' : 'bg-slate-800/50 text-slate-400 hover:text-white border-slate-700 hover:border-slate-500'}`}
         >
           PT
         </button>
         <button 
           onClick={() => i18n.changeLanguage('en')} 
           className={`text-xs font-bold py-2 px-3 rounded-full transition-all border ${i18n.language === 'en' ? 'bg-primary text-slate-900 border-primary' : 'bg-slate-800/50 text-slate-400 hover:text-white border-slate-700 hover:border-slate-500'}`}
         >
           EN
         </button>
      </div>

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <Link 
          to="/" 
          className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors hover:-translate-x-1 duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back_home', { defaultValue: 'Voltar para Home' })}
        </Link>

        
         <div className="text-center mb-8">
          {/* VERSÃO ANTIGA (COM SPARKLES) */}
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
          <img src="/logo.3.png" className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('auth.login_title')}</h1>
          <p className="text-slate-400">{t('auth.login_subtitle')}</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 uppercase tracking-wider text-[11px]">{t('auth.label_email')}</label>
              <Input 
                {...register('email')}
                type="email" 
                placeholder={t('auth.placeholder_email', { defaultValue: 'seu@email.com' })}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-primary focus:ring-primary/20 h-11"
              />
              {errors.email && <span className="text-red-400 text-xs">{errors.email.message}</span>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 uppercase tracking-wider text-[11px]">{t('auth.label_password')}</label>
                <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    {t('auth.forgot_password', { defaultValue: 'Esqueceu a senha?' })}
                </a>
              </div>
              <Input 
                {...register('password')}
                type="password" 
                placeholder="••••••"
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-primary focus:ring-primary/20 h-11"
              />
              {errors.password && <span className="text-red-400 text-xs">{errors.password.message}</span>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-bold h-11 shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.btn_login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {t('auth.no_account_question', { defaultValue: 'Não tem uma conta?' })}{' '}
              <Link to="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                {t('auth.signup_link_text', { defaultValue: 'Cadastre-se' })}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}