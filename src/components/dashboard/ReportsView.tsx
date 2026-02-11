import { useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan'; 
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, TrendingUp, Calendar, DollarSign, Lock, CreditCard, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { FinancialReport } from './FinancialReport'; // Importando o relatório de impressão

export default function ReportsView() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { plan } = usePlan(); 
  
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Ref para impressão
  const componentRef = useRef<HTMLDivElement>(null);

  // Hook de impressão
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_Financeiro_${format(new Date(), 'yyyy-MM')}`,
  });

  // --- LÓGICA DE DATAS SIMPLIFICADA E ROBUSTA ---
  const dateRange = useMemo(() => {
    const now = new Date();
    
    // 1. Personalizado
    if (selectedMonth === 'custom') {
        return { 
            start: startOfDay(parseISO(customStart)), 
            end: endOfDay(parseISO(customEnd)),
            display: `${format(parseISO(customStart), 'dd/MM')} - ${format(parseISO(customEnd), 'dd/MM')}`
        };
    }
    
    // 2. Períodos Pré-definidos
    const monthsBack = parseInt(selectedMonth);
    let start, end, display;

    if (monthsBack === 0) { // Este mês
        start = startOfMonth(now);
        end = endOfMonth(now);
        display = format(now, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS });
    } else if (monthsBack === 1) { // Mês passado
        const target = subMonths(now, 1);
        start = startOfMonth(target);
        end = endOfMonth(target);
        display = format(target, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS });
    } else { // Últimos X meses
        const target = subMonths(now, monthsBack);
        start = startOfMonth(target);
        end = endOfMonth(now);
        display = t('dashboard.reports.last_months', { count: monthsBack, defaultValue: `Últimos ${monthsBack} meses` });
    }

    return { start, end, display };
  }, [selectedMonth, customStart, customEnd, i18n.language, t]);

  // --- BUSCA DADOS ---
  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports-advanced', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const bid = member?.business_id;
      if (!bid) return { dailyRevenue: [], totalRevenue: 0, appointmentsCount: 0, topServices: [], ticket: 0, revenue: 0, count: 0, chartData: [], appointmentsList: [] };

      // ATUALIZAÇÃO: Buscando também o nome do cliente (profiles)
      const { data: apps, error } = await supabase
        .from('appointments')
        .select(`
            id, appointment_date, status,
            services ( name, price ),
            profiles:client_id ( name )
        `)
        .eq('business_id', bid)
        .gte('appointment_date', dateRange.start.toISOString())
        .lte('appointment_date', dateRange.end.toISOString())
        .or('status.eq.confirmed,status.eq.completed');
      
      if (error) throw error;

      // Processamento
      const dailyMap = new Map();
      let total = 0;
      const servicesMap = new Map();

      // Lista formatada para o Relatório de Impressão
      const appointmentsList = apps?.map((app: any) => ({
        start_time: app.appointment_date,
        client_name: app.profiles?.name || t('common.client', { defaultValue: 'Cliente' }), // Tenta pegar o nome ou usa padrão
        service_name: app.services?.name || '-',
        price: app.services?.price || 0
      })) || [];

      // Preenche dias vazios para o gráfico não ficar buracado
      const interval = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      interval.forEach(d => dailyMap.set(format(d, 'yyyy-MM-dd'), 0));

      apps?.forEach((app: any) => {
          const dayKey = app.appointment_date.split('T')[0];
          const price = app.services?.price || 0;
          
          if (dailyMap.has(dayKey)) {
              dailyMap.set(dayKey, dailyMap.get(dayKey) + price);
          } else {
              dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + price);
          }
          
          total += price;

          // Top Serviços
          const sName = app.services?.name || 'Outros';
          servicesMap.set(sName, (servicesMap.get(sName) || 0) + 1);
      });

      const dailyRevenue = Array.from(dailyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({
              name: format(parseISO(date), 'dd/MM'),
              fullDate: format(parseISO(date), 'dd/MM/yyyy'),
              value
          }));

      const topServices = Array.from(servicesMap.entries())
        .map(([name, count]) => ({ 
            name, 
            count,
            value: apps?.filter((a: any) => a.services?.name === name).reduce((acc: number, curr: any) => acc + (curr.services?.price || 0), 0) || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { 
          chartData: dailyRevenue, 
          revenue: total, 
          count: apps?.length || 0, 
          ticket: apps?.length ? total / apps.length : 0,
          topServices,
          appointmentsList // Retorna a lista pronta para impressão
      };
    },
    enabled: !!user?.id && (plan === 'pro' || plan === 'business') 
  });

  const currencyFormatter = new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: i18n.language === 'pt' ? 'BRL' : 'USD'
  });

  // --- TELA DE BLOQUEIO (Plano Free) ---
  if (plan === 'free') {
      return (
          <div className="relative min-h-[500px] w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
              
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="grid grid-cols-3 gap-4 p-8">
                    <div className="h-32 bg-slate-700 rounded-xl w-full"></div>
                    <div className="h-32 bg-slate-700 rounded-xl w-full"></div>
                    <div className="h-32 bg-slate-700 rounded-xl w-full"></div>
                    <div className="h-64 bg-slate-700 rounded-xl w-full col-span-3 mt-4"></div>
                 </div>
              </div>

              <div className="relative z-10 max-w-md space-y-6 bg-slate-800/80 p-8 rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                      <Lock className="w-8 h-8 text-amber-500" />
                  </div>
                  
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.reports.upgrade_title', { defaultValue: 'Relatórios Financeiros' })}</h2>
                      <p className="text-slate-400 leading-relaxed">
                          {t('dashboard.reports.upgrade_desc', { defaultValue: 'Acompanhe seu faturamento diário, serviços mais vendidos e métricas de crescimento com o plano Pro.' })}
                      </p>
                  </div>

                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-12 text-lg"
                    onClick={() => window.location.hash = '#pricing'} 
                  >
                      {t('dashboard.banner.cta', { defaultValue: 'Ver Planos' })}
                  </Button>
                  
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t('common.premium_feature', {defaultValue: 'Recurso Premium'})}</p>
              </div>
          </div>
      )
  }

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-primary" /> {t('dashboard.tabs.financial', { defaultValue: 'Financeiro' })}
                </h2>
                <p className="text-slate-400 capitalize">{dateRange.display}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {selectedMonth === 'custom' && (
                    <div className="flex gap-2 items-center bg-slate-800 p-1 px-3 rounded-md border border-white/10 animate-in slide-in-from-right-5">
                       <input 
                           type="date" 
                           value={customStart}
                           onChange={(e) => setCustomStart(e.target.value)}
                           className="bg-transparent text-white text-sm focus:outline-none py-1 [color-scheme:dark]"
                       />
                       <span className="text-slate-500">-</span>
                       <input 
                           type="date" 
                           value={customEnd}
                           onChange={(e) => setCustomEnd(e.target.value)}
                           className="bg-transparent text-white text-sm focus:outline-none py-1 [color-scheme:dark]"
                       />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white focus:ring-0">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="0">{t('dashboard.reports.this_month', { defaultValue: 'Este mês' })}</SelectItem>
                            <SelectItem value="1">{t('dashboard.reports.last_month', { defaultValue: 'Mês Passado' })}</SelectItem>
                            <SelectItem value="3">{t('dashboard.reports.last_3_months', { defaultValue: 'Últimos 3 Meses' })}</SelectItem>
                            <SelectItem value="custom" className="text-primary font-bold">{t('dashboard.reports.custom', { defaultValue: 'Personalizado' })}</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {/* Botão de Impressão Atualizado */}
                    <Button variant="outline" className="gap-2 text-slate-300 border-slate-600 hover:text-white hover:bg-slate-700" onClick={handlePrint}>
                        <Printer className="w-4 h-4" /> 
                    </Button>
                </div>
            </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-slate-800 border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.reports.total_revenue', { defaultValue: 'Faturamento Total' })}</p>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-white">
                        {currencyFormatter.format(stats?.revenue || 0)}
                    </span>
                </div>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.reports.appointments_count', { defaultValue: 'Atendimentos' })}</p>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">{stats?.count || 0}</span>
                </div>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.reports.ticket_avg', { defaultValue: 'Ticket Médio' })}</p>
                 <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-white">{currencyFormatter.format(stats?.ticket || 0)}</span>
                 </div>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* GRÁFICO */}
           <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 min-h-[400px]">
              <h4 className="font-bold text-white mb-6">{t('dashboard.reports.chart_title', { defaultValue: 'Evolução Diária' })}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            minTickGap={15}
                        />
                        <YAxis hide />
                        <Tooltip
                    formatter={(value: number) => [
                      currencyFormatter.format(value),
                      t('dashboard.reports.revenue_label', { defaultValue: 'Receita' })
                    ]}
                    // --- INÍCIO DA CORREÇÃO DE CSS ---
                    contentStyle={{ 
                      backgroundColor: '#1e293b', // Cor de fundo escura (slate-800)
                      borderColor: '#334155',     // Borda sutil (slate-700)
                      borderRadius: '8px',        // Cantos arredondados
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' // Sombra suave
                    }}
                    itemStyle={{
                      color: '#f8fafc' // Cor do texto quase branca (slate-50)
                    }}
                    labelStyle={{
                      color: '#94a3b8' // Cor da data/label um pouco mais cinza (slate-400)
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} // Cor do cursor ao passar o mouse
                    // --- FIM DA CORREÇÃO DE CSS ---
                  />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {stats?.chartData?.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#4ade80' : '#334155'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* TOP SERVIÇOS */}
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h4 className="font-bold text-white mb-6">{t('dashboard.reports.top_services', { defaultValue: 'Top Serviços' })}</h4>
              <div className="space-y-4">
                {!stats?.topServices || stats.topServices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.reports.no_data', { defaultValue: 'Nenhum dado ainda.' })}</p>
                ) : (
                  stats.topServices.map((service: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{service.name}</p>
                          <p className="text-xs text-slate-500">{service.count} {t('common.sales', { defaultValue: 'vendas' })}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">
                          {currencyFormatter.format(service.value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>

        {/* --- COMPONENTE DE IMPRESSÃO INVISÍVEL --- */}
        <div style={{ display: "none" }}>
            <FinancialReport 
                ref={componentRef} 
                data={stats?.appointmentsList || []} 
                totalRevenue={stats?.revenue || 0} 
                period={dateRange.display}
            />
        </div>
    </div>
  );
}