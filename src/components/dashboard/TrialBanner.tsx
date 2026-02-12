import { Clock, Crown, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { usePlan } from '../../hooks/usePlan';
import { useTranslation } from 'react-i18next'; // 1. IMPORTADO

export default function TrialBanner() {
  const { t } = useTranslation(); // 2. HOOK INICIADO
  const { isTrial, daysLeft, plan } = usePlan();

  if (!isTrial || plan === 'free') return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border-b border-white/10 text-white px-4 py-3 relative overflow-hidden print:hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
         <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="bg-white/10 p-2 rounded-full shrink-0 animate-pulse">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            {/* 3. TEXTOS TRADUZIDOS */}
            <p className="text-sm font-medium text-purple-100">
              <span className="font-bold text-white">
                {t('dashboard.trial_banner.title')}
              </span> {t('dashboard.trial_banner.desc')}
            </p>
            <p className="text-xs text-purple-300 flex items-center gap-1 justify-center sm:justify-start mt-0.5">
              <Clock className="w-3 h-3" /> 
              {t('dashboard.trial_banner.days_left', { count: daysLeft })}
            </p>
          </div>
        </div>

        <Button 
          size="sm" 
          onClick={() => window.location.hash = '#pricing'}
          className="bg-white text-purple-900 hover:bg-purple-50 font-bold border-0 shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
        >
          {t('dashboard.trial_banner.btn_subscribe')} <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}