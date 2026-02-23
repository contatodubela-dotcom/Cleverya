import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { WhatsAppButton } from '../WhatsAppButton'; 
import { 
  Users, Calendar, DollarSign, TrendingUp, Clock, 
  ArrowUpRight, ArrowDownRight, ArrowRight, X // <--- Import X
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-all shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [showBanner, setShowBanner] = useState(true); // <--- Estado do Banner
  
  const currencyCode = i18n.language === 'en' ? 'USD' : 'BRL';
  const currencyLocale = i18n.language === 'en' ? 'en-US' : 'pt-BR';
  const dateLocale = i18n.language === 'en' ? enUS : ptBR;

  const handleViewPlans = () => {
    window.location.hash = '#pricing';
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats-overview', user?.id],
    queryFn: async () => {
      // Alterado para buscar também o plano da empresa
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id, business:businesses(plan_type)')
        .eq('user_id', user?.id)
        .single();
        
      const businessId = member?.business_id;
      // @ts-ignore
      const planType = member?.business?.plan_type || 'free';

      if (!businessId) return null;

      const now = new Date();
      const firstDay = startOfMonth(now).toISOString();
      const lastDay = endOfMonth(now).toISOString();

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          services ( price, name ),
          clients ( name, phone ),
          professionals ( name )
        `)
        .eq('business_id', businessId)
        .neq('status', 'pending_payment') // <-- MÁGICA: Esconde os PIXs não pagos!
        .gte('appointment_date', firstDay)
        .lte('appointment_date', lastDay)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      return { appointments, clientsCount, planType };
    },
    enabled: !!user?.id,
  });

  const stats = useMemo(() => {
    if (!dashboardData?.appointments) return { revenue: 0, appointments: 0, today: 0, clients: 0, todayApps: [], chartData: [], planType: 'free' };

    const apps = dashboardData.appointments;
    const today = new Date();
    
    const revenue = apps
      .filter((app: any) => app.status === 'confirmed' || app.status === 'completed')
      .reduce((acc: number, app: any) => acc + (app.services?.price || 0), 0);

    const todayApps = apps.filter((app: any) => isSameDay(parseISO(app.appointment_date), today) && app.status !== 'cancelled');

    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInterval = eachDayOfInterval({ start, end });

    const dailyData = daysInterval.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayValue = apps
            .filter((app: any) => app.appointment_date === dateKey && (app.status === 'confirmed' || app.status === 'completed'))
            .reduce((acc: number, app: any) => acc + (app.services?.price || 0), 0);
        
        return {
            name: format(day, 'dd'),
            fullDate: format(day, "d 'de' MMMM", { locale: dateLocale }),
            value: dayValue
        };
    });

    return {
      revenue,
      appointments: apps.length,
      today: todayApps.length,
      clients: dashboardData.clientsCount || 0,
      todayApps,
      chartData: dailyData,
      planType: dashboardData.planType // Passando o plano
    };
  }, [dashboardData, dateLocale]);

  if (isLoading) {
    return <div className="p-8 text-white flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.overview.title_today', { defaultValue: 'Visão Geral' })}</h1>
        <p className="text-slate-400">{t('dashboard.overview.subtitle', { defaultValue: 'Resumo financeiro e operacional deste mês.' })}</p>
      </div>

      {/* BANNER INTELIGENTE: SÓ APARECE SE FOR FREE E NÃO TIVER FECHADO */}
      {(stats.planType === 'free' && showBanner) && (
        <div className="relative bg-gradient-to-r from-[#240b3b] to-[#4c1d95] rounded-2xl p-6 mb-8 border border-purple-500/30 shadow-[0_0_20px_rgba(88,28,135,0.3)] overflow-hidden group">
          
          <button 
              onClick={() => setShowBanner(false)} 
              className="absolute top-2 right-2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-purple-200 hover:text-white transition-all z-20"
              aria-label="Fechar banner"
          >
              <X className="w-4 h-4" />
          </button>

          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{t('common.premium')}</span>
                <h3 className="text-xl font-bold text-white">{t('dashboard.banner.upgrade_pro_title', { defaultValue: 'Cleverya Pro' })}</h3>
              </div>
              <p className="text-purple-200 max-w-lg text-sm leading-relaxed">
                {t('dashboard.banner.description', { defaultValue: 'Desbloqueie relatórios avançados, múltiplos profissionais e lembretes automáticos.' })}
              </p>
            </div>
            <Button 
              onClick={handleViewPlans}
              className="bg-white text-purple-900 hover:bg-purple-50 font-bold shadow-lg group"
            >
              {t('dashboard.banner.cta', { defaultValue: 'Ver Planos' })} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('dashboard.overview.revenue', { defaultValue: 'Faturamento (Mês)' })}
          value={new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyCode }).format(stats.revenue)}
          icon={DollarSign}
          color="bg-green-500 text-green-500"
          trend={12} 
        />
        <StatCard 
          title={t('dashboard.calendar.total', { defaultValue: 'Agendamentos' })}
          value={stats.appointments}
          icon={Calendar}
          color="bg-blue-500 text-blue-500"
          trend={8}
        />
        <StatCard 
          title={t('dashboard.overview.total_clients', { defaultValue: 'Base de Clientes' })}
          value={stats.clients}
          icon={Users}
          color="bg-purple-500 text-purple-500"
          trend={5}
        />
        <StatCard 
          title={t('dashboard.overview.today', { defaultValue: 'Agenda Hoje' })}
          value={stats.today}
          icon={Clock}
          color="bg-orange-500 text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6 h-96 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    {t('dashboard.overview.financial_performance', { defaultValue: 'Desempenho Financeiro' })}
                </h3>
                <p className="text-xs text-slate-400">{t('dashboard.overview.daily_revenue', { defaultValue: 'Receita diária confirmada' })}</p>
             </div>
             <span className="text-2xl font-bold text-green-400">
                {new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyCode }).format(stats.revenue)}
             </span>
          </div>
          
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                />
                <YAxis hide />
                <Tooltip 
                    cursor={{ stroke: '#4ade80', strokeWidth: 1, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#4ade80' }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                    formatter={(value: number) => [new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyCode }).format(value), t('dashboard.reports.revenue', { defaultValue: 'Receita' })]}
                    labelFormatter={(label) => `${t('common.day', {defaultValue: 'Dia'})} ${label}`}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4ade80" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 h-96 overflow-y-auto custom-scrollbar">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> 
            {t('dashboard.overview.next_schedules', { defaultValue: 'Próximos Horários' })}
          </h3>
          
          <div className="space-y-3">
            {stats.todayApps.length === 0 && dashboardData?.appointments?.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                    <p>{t('dashboard.overview.no_future_appointments', { defaultValue: 'Nenhum agendamento.' })}</p>
                </div>
            )}

            {(stats.todayApps.length > 0 ? stats.todayApps : (dashboardData?.appointments?.filter((a: any) => new Date(a.appointment_date) > new Date()).slice(0, 5) || []))
              .map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl border border-slate-600/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${app.status === 'confirmed' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-yellow-400'}`}></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {app.clients?.name || t('common.client', {defaultValue: 'Cliente'})}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {format(parseISO(app.appointment_date), "dd/MM", { locale: dateLocale })} • {app.appointment_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <WhatsAppButton 
                        clientName={app.clients?.name}
                        clientPhone={app.clients?.phone}
                        serviceName={app.services?.name}
                        date={app.appointment_date}
                        time={app.appointment_time.slice(0, 5)}
                        variant="icon"
                    />
                    {app.services?.price && (
                        <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-slate-600">
                            {new Intl.NumberFormat(currencyLocale, { style: 'currency', currency: currencyCode }).format(app.services.price)}
                        </span>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}