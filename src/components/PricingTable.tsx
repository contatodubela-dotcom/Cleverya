import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, Building2, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth'; 

export function PricingTable() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth(); 
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const isBRL = i18n.language?.startsWith('pt');
  const currency = isBRL ? 'R$' : '$';

  const plans = [
    {
      name: 'Free',
      id: 'free',
      description: isBRL ? 'Para começar e sentir o valor.' : 'To start and feel the value.',
      price: {
        monthly: '0',
        yearly: '0',
      },
      links: {
        monthly: '',
        yearly: '',
      },
      features: [
        isBRL ? 'Até 50 agendamentos/mês' : 'Up to 50 appointments/mo',
        isBRL ? '1 Profissional' : '1 Professional',
        isBRL ? 'Agenda Online' : 'Online Booking',
        isBRL ? 'Link de agendamento' : 'Booking Link',
      ],
      popular: false,
      icon: Zap,
      color: 'bg-slate-500',
      textColor: 'text-slate-400',
    },
    {
      name: 'Pro',
      id: 'pro', 
      description: isBRL ? 'Para profissionais independentes em crescimento.' : 'For growing independent professionals.',
      price: {
        monthly: isBRL ? '29,90' : '9.90',
        yearly: isBRL ? '269,10' : '89.10',
      },
      links: {
        monthly: isBRL 
          ? 'https://buy.stripe.com/8x2eVfb7rg1A93E6qa3gk00' 
          : 'https://buy.stripe.com/8x2bJ36RbaHgdjUbKu3gk01',
        yearly: isBRL 
          ? 'https://buy.stripe.com/cNi6oJ4J34iS93EaGq3gk07' 
          : 'https://buy.stripe.com/eVqaEZdfz8z80x8dSC3gk06',
      },
      features: [
        isBRL ? 'Agendamentos ilimitados' : 'Unlimited appointments',
        isBRL ? 'Até 3 profissionais' : 'Up to 3 professionals',
        isBRL ? 'Relatórios básicos' : 'Basic reports',
        isBRL ? 'Link personalizado' : 'Custom link',
      ],
      popular: true,
      icon: Sparkles,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
    },
    {
      name: 'Business',
      id: 'business', 
      description: isBRL ? 'Para clínicas e estabelecimentos maiores.' : 'For clinics and larger establishments.',
      price: {
        monthly: isBRL ? '59,90' : '19.90',
        yearly: isBRL ? '539,10' : '179.10',
      },
      links: {
        monthly: isBRL 
          ? 'https://buy.stripe.com/fZueVfejD8z82FgcOy3gk02' 
          : 'https://buy.stripe.com/dRm6oJ6Rb2aK1Bcg0K3gk03',
        yearly: isBRL 
          ? 'https://buy.stripe.com/dRm8wR0sNaHg6Vw15Q3gk05' 
          : 'https://buy.stripe.com/4gM5kFcbvg1AdjU5m63gk04',
      },
      features: [
        isBRL ? 'Tudo do Pro' : 'Everything in Pro',
        isBRL ? 'Profissionais ilimitados' : 'Unlimited professionals',
        isBRL ? 'Gestão multi-unidade' : 'Multi-unit management',
        isBRL ? 'Exportação de dados' : 'Data export',
      ],
      popular: false,
      icon: Building2,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
    },
  ];

  // Função para lidar com o clique
  const handlePlanClick = (plan: typeof plans[0], rawLink: string) => {
    // 1. Se não tiver usuário, redireciona para criar conta
    if (!user) {
      window.location.href = `/signup?plan=${plan.id}&cycle=${billingCycle}`;
      return;
    }

    // 2. Se for plano Free e já estiver logado, não faz nada (botão estará desabilitado visualmente também)
    if (plan.id === 'free') {
      return;
    }

    // 3. Se for Pago, abre Stripe em NOVA ABA para não deslogar
    if (rawLink) {
      const checkoutUrl = `${rawLink}?client_reference_id=${user.id}&prefilled_email=${user.email}`;
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="flex justify-center mb-8 mt-4">
        <div className="bg-slate-800/50 p-1 rounded-lg inline-flex relative border border-white/5">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-3 sm:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative z-10",
              billingCycle === 'monthly' ? "text-white font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            {isBRL ? 'Mensal' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={cn(
              "px-3 sm:px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 relative z-10",
              billingCycle === 'yearly' ? "text-white font-bold" : "text-slate-400 hover:text-white"
            )}
          >
            {isBRL ? 'Anual' : 'Yearly'}
            <span className="absolute -top-3 -right-5 bg-green-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce shadow-lg z-20 border border-slate-900">
              -25%
            </span>
          </button>
          
          <div 
            className={cn(
              "absolute top-1 bottom-1 w-[50%] bg-primary rounded-md transition-all duration-300 shadow-lg",
              billingCycle === 'monthly' ? "left-1" : "left-[49%]"
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isFree = plan.id === 'free';
          const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
          const rawLink = billingCycle === 'monthly' ? plan.links.monthly : plan.links.yearly;
          
          return (
            <div 
              key={plan.name}
              className={cn(
                "relative bg-slate-800/40 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:bg-slate-800/60 flex flex-col",
                plan.popular ? "border-primary shadow-[0_0_30px_rgba(246,173,85,0.15)] z-10 scale-[1.02] md:scale-105" : "border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-slate-900" />
                  {isBRL ? 'Mais Popular' : 'Most Popular'}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={cn("p-3 rounded-xl bg-opacity-20 border border-white/5", plan.color)}>
                  <Icon className={cn("w-6 h-6", plan.textColor)} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-xs leading-tight">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                {isFree ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-3xl font-extrabold text-white tracking-tight">{isBRL ? 'Grátis' : 'Free'}</span>
                    </div>
                ) : (
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-lg font-medium text-slate-400 mb-1">{currency}</span>
                      <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                      <span className="text-slate-500 mb-1 text-sm font-medium">
                        /{billingCycle === 'monthly' ? (isBRL ? 'mês' : 'mo') : (isBRL ? 'ano' : 'yr')}
                      </span>
                    </div>
                )}
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-slate-700/50 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="leading-tight text-xs">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Botão sem tag <a> ao redor */}
              <div className="mt-auto w-full">
                <Button 
                  onClick={() => handlePlanClick(plan, rawLink)}
                  disabled={!!user && isFree} // Desabilita o botão Free se o usuário já estiver logado
                  className={cn(
                    "w-full font-bold h-12 text-base transition-all rounded-xl shadow-lg",
                    plan.popular 
                      ? "bg-primary text-slate-900 hover:bg-primary/90" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                  )}
                >
                  {isFree 
                    ? (isBRL ? 'Plano Atual' : 'Current Plan') 
                    : (isBRL ? 'Começar Agora' : 'Get Started')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}