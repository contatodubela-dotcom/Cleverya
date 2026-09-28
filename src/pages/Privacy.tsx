import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.language === 'pt';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="flex items-center gap-4 mb-12">
          <Link to="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white pl-0 gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('common.back', {defaultValue: 'Voltar'})}
            </Button>
          </Link>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
               <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('legal.privacy_title')}</h1>
          </div>

          <div className="space-y-6 text-gray-300 leading-relaxed text-sm md:text-base">
            <p><strong>{t('legal.last_updated')}:</strong> {new Date().toLocaleDateString(isPt ? 'pt-BR' : 'en-US')}</p>

            {isPt ? (
               // TEXTO EM PORTUGUÊS
               <>
                 <p>A Cleverya valoriza sua privacidade. Esta política descreve como tratamos seus dados.</p>
                 <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Coleta de Dados</h2>
                 <p>Coletamos nome, e-mail e dados de pagamento para fornecer o serviço.</p>
                 <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Uso das Informações</h2>
                 <p>Usamos seus dados para operar a plataforma, processar pagamentos e enviar notificações.</p>
               </>
            ) : (
              // TEXTO EM INGLÊS
              <>
                 <p>Cleverya values your privacy. This policy describes how we handle your data.</p>
                 <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Data Collection</h2>
                 <p>We collect name, email, and payment data to provide the service.</p>
                 <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Use of Information</h2>
                 <p>We use your data to operate the platform, process payments, and send notifications.</p>
                 <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Security</h2>
                 <p>We implement security measures to protect your information (SSL, Encryption).</p>
              </>
            )}

            <div className="bg-slate-800/50 border border-white/5 rounded-lg p-4 mt-8">
              <p><strong>{t('legal.contact_title')}:</strong> contato@cleverya.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}