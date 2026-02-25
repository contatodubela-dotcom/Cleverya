import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan'; 
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, TrendingUp, Calendar, DollarSign, Lock, Wallet, CreditCard, Printer, FileText, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { FinancialReport } from './FinancialReport'; 

export default function ReportsView() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { plan } = usePlan(); 
  
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // NOVO: Estado para controlar a visualização do relatório
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    document.title = `Relatorio_Financeiro_${format(new Date(), 'yyyy-MM')}`;
    window.print();
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    if (selectedMonth === 'custom') {
        return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)), display: `${format(parseISO(customStart), 'dd/MM')} - ${format(parseISO(customEnd), 'dd/MM')}` };
    }
    const monthsBack = parseInt(selectedMonth);
    let start, end, display;
    if (monthsBack === 0) { 
        start = startOfMonth(now); end = endOfMonth(now); display = format(now, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS });
    } else if (monthsBack === 1) { 
        const target = subMonths(now, 1); start = startOfMonth(target); end = endOfMonth(target); display = format(target, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS });
    } else { 
        const target = subMonths(now, monthsBack); start = startOfMonth(target); end = endOfMonth(now); display = t('dashboard.reports.last_months', { count: monthsBack, defaultValue: `Últimos ${monthsBack} meses` });
    }
    return { start, end, display };
  }, [selectedMonth, customStart, customEnd, i18n.language, t]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reports-advanced', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const bid = member?.business_id;
      if (!bid) return { totalPaid: 0, totalPending: 0, count: 0, topServices: [], chartData: [], appointmentsList: [] };

      const { data: apps, error } = await supabase
        .from('appointments')
        .select(`
            id, appointment_date, status, deposit_paid, balance_paid,
            services ( name, price ),
            profiles:client_id ( name )
        `)
        .eq('business_id', bid)
        .gte('appointment_date', dateRange.start.toISOString())
        .lte('appointment_date', dateRange.end.toISOString())
        .in('status', ['confirmed', 'completed']);
      
      if (error) throw error;

      const validApps = apps || [];
      let totalPaid = 0;
      let totalPending = 0;
      const dailyMap = new Map();
      const servicesMap = new Map();

      const interval = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      interval.forEach(d => dailyMap.set(format(d, 'yyyy-MM-dd'), 0));

      const appointmentsList = validApps.map((app: any) => {
          const price = app.services?.price || 0;
          const deposit = Number(app.deposit_paid) || 0;
          const balance = Number(app.balance_paid) || 0;
          
          const paid = deposit + balance;
          const pending = app.status === 'completed' ? 0 : Math.max(0, price - paid);

          totalPaid += paid;
          totalPending += pending;

          const dayKey = app.appointment_date.split('T')[0];
          if (paid > 0) {
              if (dailyMap.has(dayKey)) dailyMap.set(dayKey, dailyMap.get(dayKey) + paid);
              else dailyMap.set(dayKey, paid);
          }

          const sName = app.services?.name || 'Outros';
          if (!servicesMap.has(sName)) servicesMap.set(sName, { count: 0, revenue: 0 });
          const sData = servicesMap.get(sName);
          sData.count += 1;
          sData.revenue += paid; 

          return {
              start_time: app.appointment_date,
              client_name: app.profiles?.name || t('common.client', { defaultValue: 'Cliente' }), 
              service_name: app.services?.name || '-',
              total_value: price,
              paid_value: paid,
              pending_value: pending,
              status: app.status
          };
      });

      const dailyRevenue = Array.from(dailyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, value]) => ({
              name: format(parseISO(date), 'dd/MM'),
              fullDate: format(parseISO(date), 'dd/MM/yyyy'),
              value
          }));

      const topServices = Array.from(servicesMap.entries())
        .map(([name, data]: any) => ({ 
            name, 
            count: data.count,
            value: data.revenue
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { 
          totalPaid, 
          totalPending, 
          count: validApps.length, 
          chartData: dailyRevenue, 
          topServices,
          appointmentsList
      };
    },
    enabled: !!user?.id && (plan === 'pro' || plan === 'business') 
  });

  const currencyFormatter = new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: i18n.language === 'pt' ? 'BRL' : 'USD'
  });

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
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-12 text-lg" onClick={() => window.location.hash = '#pricing'}>
                      {t('dashboard.banner.cta', { defaultValue: 'Ver Planos' })}
                  </Button>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t('common.premium_feature', {defaultValue: 'Recurso Premium'})}</p>
              </div>
          </div>
      )
  }

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-white w-8 h-8" /></div>;

  // --- MODO DE PRÉ-VISUALIZAÇÃO DE IMPRESSÃO ---
  if (showPreview) {
    return (
      <div className="space-y-6 animate-in fade-in pb-12">
        
        {/* Barra de Ferramentas Superior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg print:hidden">
          <Button variant="ghost" onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white bg-slate-900/50">
             <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back', {defaultValue: 'Voltar'})}
          </Button>
          <h2 className="text-lg font-bold text-white hidden md:block">
            {i18n.language === 'pt' ? 'Pré-visualização do Relatório' : 'Report Preview'}
          </h2>
          <Button onClick={handlePrint} className="bg-primary text-slate-900 font-bold w-full md:w-auto shadow-[0_0_15px_rgba(246,173,85,0.3)]">
             <Printer className="w-4 h-4 mr-2" /> {t('common.print', {defaultValue: 'Imprimir'})}
          </Button>
        </div>
        
        {/* A "Folha de Papel" na Tela */}
        <div className="overflow-x-auto bg-slate-900 p-4 md:p-8 rounded-2xl border border-slate-700 print:hidden shadow-inner">
            <div className="min-w-[800px] bg-white rounded-xl shadow-2xl overflow-hidden mx-auto border border-gray-300 pointer-events-none">
               <FinancialReport 
                   data={stats?.appointmentsList || []} 
                   totalPaid={stats?.totalPaid || 0}
                   totalPending={stats?.totalPending || 0}
                   period={dateRange.display}
               />
            </div>
        </div>
        
        {/* Área Oculta para a Impressora Real */}
        <div id="print-area" className="hidden">
            <FinancialReport 
                data={stats?.appointmentsList || []} 
                totalPaid={stats?.totalPaid || 0}
                totalPending={stats?.totalPending || 0}
                period={dateRange.display}
            />
        </div>
        <style>{`@media print { body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; } body { background-color: white !important; } }`}</style>
      </div>
    );
  }

  // --- MODO NORMAL DO DASHBOARD ---
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
                       <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none py-1 [color-scheme:dark]" />
                       <span className="text-slate-500">-</span>
                       <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-white text-sm focus:outline-none py-1 [color-scheme:dark]" />
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
                    
                    {/* NOVO: Botão de Visualizar */}
                    <Button variant="outline" className="gap-2 text-primary border-primary/50 hover:bg-primary/10" onClick={() => setShowPreview(true)}>
                        <FileText className="w-4 h-4" /> 
                        <span className="hidden md:inline">{i18n.language === 'pt' ? 'Ver Relatório' : 'View Report'}</span>
                    </Button>

                    <Button variant="outline" className="gap-2 text-slate-300 border-slate-600 hover:text-white hover:bg-slate-700" onClick={handlePrint} title={t('common.print', {defaultValue: 'Imprimir'})}>
                        <Printer className="w-4 h-4" /> 
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-slate-800 border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{i18n.language === 'pt' ? 'Em Caixa (Recebido)' : 'In Cash (Paid)'}</p>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-2xl font-bold text-white">{currencyFormatter.format(stats?.totalPaid || 0)}</span>
                </div>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{i18n.language === 'pt' ? 'A Receber (Pendente)' : 'Pending (To Receive)'}</p>
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <span className="text-2xl font-bold text-white">{currencyFormatter.format(stats?.totalPending || 0)}</span>
                </div>
            </Card>
            <Card className="p-6 bg-slate-800 border-slate-700">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{i18n.language === 'pt' ? 'Volume Total' : 'Total Volume'}</p>
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold text-white">{currencyFormatter.format((stats?.totalPaid || 0) + (stats?.totalPending || 0))}</span>
                 </div>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 min-h-[400px]">
              <h4 className="font-bold text-white mb-6">{t('dashboard.reports.chart_title', { defaultValue: 'Evolução Diária' })}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} minTickGap={15} />
                        <YAxis hide />
                        <Tooltip
                            formatter={(value: number) => [currencyFormatter.format(value), t('dashboard.reports.revenue_label', { defaultValue: 'Receita' })]}
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#4ade80' }} labelStyle={{ color: '#94a3b8' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
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

           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h4 className="font-bold text-white mb-6">{t('dashboard.reports.top_services', { defaultValue: 'Top Serviços' })}</h4>
              <div className="space-y-4">
                {!stats?.topServices || stats.topServices.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.reports.no_data', { defaultValue: 'Nenhum dado ainda.' })}</p>
                ) : (
                  stats.topServices.map((service: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-200">{service.name}</p>
                          <p className="text-xs text-slate-500">{service.count} {t('common.sales', { defaultValue: 'vendas' })}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">{currencyFormatter.format(service.value)}</span>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>

        {/* Área Oculta para a Impressora Direta */}
        <div id="print-area" className="hidden">
            <FinancialReport 
                data={stats?.appointmentsList || []} 
                totalPaid={stats?.totalPaid || 0}
                totalPending={stats?.totalPending || 0}
                period={dateRange.display}
            />
        </div>

        <style>{`@media print { body * { visibility: hidden !important; } #print-area, #print-area * { visibility: visible !important; } #print-area { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; } body { background-color: white !important; } }`}</style>
    </div>
  );
}