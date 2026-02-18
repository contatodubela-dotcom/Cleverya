import { Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useCountry } from '../hooks/useCountry'; // Importamos a inteligência de localização

export function SubscribeBanner() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  
  // 1. DETECÇÃO INTELIGENTE (Igual à Tabela de Preços)
  const { currency: locCurrency, loading: locLoading } = useCountry();
  
  // Se o idioma for PT ou o país for BR -> Modo Brasil
  const isLanguagePT = i18n.language?.startsWith('pt');
  const isLocationBR = !locLoading && locCurrency === 'BRL';
  const isBRL = isLanguagePT || isLocationBR;

  const handleSubscribe = () => {
    if (!user) return;

    // 2. SELEÇÃO DO LINK CORRETO (BRL ou USD)
    // Usei os mesmos links que já configuramos no PricingTable
    const linkBRL = "https://buy.stripe.com/8x2eVfb7rg1A93E6qa3gk00"; 
    const linkUSD = "https://buy.stripe.com/8x2bJ36RbaHgdjUbKu3gk01";
    
    const baseUrl = isBRL ? linkBRL : linkUSD;

    // Adiciona rastreio do usuário
    const checkoutUrl = `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || '')}`;

    window.open(checkoutUrl, '_blank');
  };

  // 3. TRADUÇÃO DOS TEXTOS (Sem precisar mexer no arquivo i18n.ts agora)
  const txt = {
    badge: isBRL ? 'Upgrade' : 'Upgrade',
    unlock: isBRL ? 'Desbloqueie todo o potencial' : 'Unlock full potential',
    title: isBRL ? 'Passe para o Cleverya Pro 🚀' : 'Upgrade to Cleverya Pro 🚀',
    desc: isBRL 
      ? 'Tenha agendamentos ilimitados, lembretes automáticos no WhatsApp e relatórios financeiros completos.'
      : 'Get unlimited bookings, automatic WhatsApp reminders, and complete financial reports.',
    check1: isBRL ? 'Agenda Ilimitada' : 'Unlimited Schedule',
    check2: isBRL ? 'Sem taxas ocultas' : 'No hidden fees',
    cta: isBRL ? 'Assinar Agora' : 'Subscribe Now',
    price: isBRL ? 'Apenas R$ 29,90/mês' : 'Only $9.90/mo'
  };

  // Evita mostrar preço errado enquanto carrega
  if (locLoading) return null; 

  return (
    <div className="bg-gradient-to-r from-violet-900 to-purple-800 rounded-2xl p-6 mb-8 text-white relative overflow-hidden shadow-xl border border-white/10">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {txt.badge}
            </span>
            <span className="text-purple-200 text-sm font-medium">{txt.unlock}</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{txt.title}</h2>
          <p className="text-purple-100 mb-4 max-w-lg">
            {txt.desc}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-purple-200">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> {txt.check1}</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> {txt.check2}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 min-w-[200px]">
          <button 
            onClick={handleSubscribe}
            className="w-full bg-white text-purple-900 hover:bg-gray-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            {txt.cta}
          </button>
          <span className="text-xs text-purple-300">{txt.price}</span>
        </div>
      </div>
    </div>
  );
}