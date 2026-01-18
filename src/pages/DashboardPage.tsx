import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query'; 
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Calendar, LayoutDashboard, Settings, Sparkles, Users, ClipboardList, Share2, LogOut, FileBarChart, Crown } from 'lucide-react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import CalendarView from '../components/dashboard/CalendarView';
import ServicesManager from '../components/dashboard/ServicesManager';
import AvailabilitySettings from '../components/dashboard/AvailabilitySettings';
import ClientsManager from '../components/dashboard/ClientsManager';
import ReportsView from '../components/dashboard/ReportsView';
import ProfessionalsManager from '../components/dashboard/ProfessionalsManager';
import { PricingTable } from '../components/PricingTable'; 
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/use-mobile';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

type TabType = 'overview' | 'calendar' | 'services' | 'availability' | 'clients' | 'reports' | 'professionals';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPricingForce, setShowPricingForce] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    if (location.hash === '#pricing') {
      setActiveTab('overview');
      setShowPricingForce(true);
      setTimeout(() => {
        const element = document.getElementById('pricing-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          navigate('', { replace: true });
        }
      }, 300);
    }
  }, [location, navigate]);

  const tabs = [
    { id: 'overview' as TabType, label: t('dashboard.tabs.overview', { defaultValue: 'Visão Geral' }), icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: t('dashboard.tabs.calendar', { defaultValue: 'Agenda' }), icon: Calendar },
    { id: 'services' as TabType, label: t('dashboard.tabs.services', { defaultValue: 'Serviços' }), icon: ClipboardList },
    { id: 'professionals' as TabType, label: t('dashboard.tabs.team', { defaultValue: 'Equipe' }), icon: Users },
    { id: 'clients' as TabType, label: t('dashboard.tabs.clients', { defaultValue: 'Base' }), icon: Users },
    { id: 'reports' as TabType, label: t('dashboard.tabs.financial', { defaultValue: 'Financeiro' }), icon: FileBarChart },
    { id: 'availability' as TabType, label: t('dashboard.tabs.settings', { defaultValue: 'Ajustes' }), icon: Settings },
  ];

  const { data: businessData } = useQuery({
    queryKey: ['my-business-info', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_members')
        .select(`
          business:businesses (
            slug, 
            name,
            plan_type,
            subscription_status
          )
        `)
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data && data.business) {
        return Array.isArray(data.business) ? data.business[0] : data.business;
      }
      return null;
    },
    enabled: !!user,
  });

  const handleShareUrl = () => {
    const baseUrl = window.location.origin;
    const url = businessData?.slug 
      ? `${baseUrl}/${businessData.slug}` 
      : `${baseUrl}/book/${user?.id}`;

    navigator.clipboard.writeText(url).then(() => {
      toast.success(t('dashboard.link_copied', { defaultValue: 'Link copiado!' }) + ' ' + url);
    });
  };

  const isFree = !businessData?.plan_type || businessData.plan_type === 'free';
  const shouldShowPricing = isFree || showPricingForce;

  const displayPlan = businessData?.plan_type 
    ? businessData.plan_type.toUpperCase() 
    : 'FREE';

  const planColor = displayPlan === 'BUSINESS' 
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
    : displayPlan === 'PRO' 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-slate-700 text-slate-400 border-slate-600';

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 md:pb-6 print:bg-white print:pb-0 text-slate-100">
      
      <header className="bg-[#1e293b]/90 border-b border-white/10 sticky top-0 z-50 print:hidden backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(246,173,85,0.2)]">
                <Sparkles className="w-5 h-5 text-gray-900" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="font-bold text-lg leading-tight text-white">Cleverya</h1>
                
                {/* --- CORREÇÃO APLICADA AQUI --- */}
                {/* Removida a verificação !isMobile e adicionados estilos de responsividade */}
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium truncate max-w-[120px] md:max-w-none">
                    {businessData?.name || user?.email || 'Profissional'}
                  </p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${planColor} flex items-center gap-1 shrink-0`}>
                      {displayPlan !== 'FREE' && <Crown className="w-2 h-2" />}
                      {displayPlan}
                  </span>
                </div>
                {/* --- FIM DA CORREÇÃO --- */}

              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={toggleLanguage} variant="ghost" size="sm" className="text-xs font-bold text-gray-400 hover:text-white">
                {i18n.language === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
              </Button>

              <Button onClick={handleShareUrl} variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary hover:text-gray-900 text-primary h-9 transition-all bg-transparent">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.link_btn')}</span>
              </Button>

              <Button variant="ghost" onClick={logout} size="icon" className="h-9 w-9 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ABAS */}
      <div className="hidden md:block border-b border-white/10 bg-[#0f172a] sticky top-[73px] z-40 print:hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(246,173,85,0.5)] rounded-t-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-4 py-8 animate-fade-in print:p-0 print:max-w-none">
        
        {activeTab === 'overview' && shouldShowPricing && (
           <div id="pricing-section" className="mb-12 animate-in slide-in-from-top-10">
             <div className="text-center mb-8">
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                 {i18n.language === 'pt' ? 'Planos Disponíveis' : 'Available Plans'}
               </h2>
               {!isFree && (
                 <p className="text-green-400 font-medium mb-4">
                   {i18n.language === 'pt' ? `Seu plano atual: ${displayPlan}` : `Your current plan: ${displayPlan}`}
                 </p>
               )}
             </div>
             <PricingTable />
           </div>
        )}

        <div className="min-h-[500px]">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'professionals' && <ProfessionalsManager />}
          {activeTab === 'clients' && <ClientsManager />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'availability' && <AvailabilitySettings />}
        </div>
      </main>

      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#112240]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 pb-safe print:hidden">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all w-full ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={2} />
                <span className="text-[9px] font-medium leading-none text-center">{tab.id === 'overview' ? (i18n.language === 'pt' ? 'Início' : 'Home') : tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}