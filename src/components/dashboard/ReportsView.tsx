import { useMemo, useState } from 'react';
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

export default function ReportsView() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { plan } = usePlan(); 
  
  const [selectedMonth, setSelectedMonth] = useState('0');
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // --- LÓGICA DE DATAS CORRIGIDA ---
  const dateRange = useMemo(() => {
    const today = new Date();

    // 1. Personalizado
    if (selectedMonth === 'custom') {
      const start = startOfDay(parseISO(customStart));
      const end = endOfDay(parseISO(customEnd));
      return {
        start,
        end,
        display: `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
      };
    }

    const value = parseInt(selectedMonth);

    // 2. Mês Atual (Início do mês até o fim do mês)
    if (value === 0) {
        return {
            start: startOfMonth(today),
            end: endOfMonth(today),
            display: format(today, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS })
        };
    }

    // 3. Mês Passado (Início do mês passado até fim do mês passado)
    if (value === 1) {
        const lastMonth = subMonths(today, 1);
        return {
            start: startOfMonth(lastMonth),
            end: endOfMonth(lastMonth),
            display: format(lastMonth, 'MMMM yyyy', { locale: i18n.language === 'pt' ? ptBR : enUS })
        };
    }

    // 4. Últimos 3 Meses (De 3 meses atrás até HOJE) - CORRIGIDO
    if (value === 3) {
        const start = subMonths(today, 3); // Data de 3 meses atrás
        const end = endOfDay(today);       // Até hoje
        return {
            start: startOfDay(start),
            end: end,
            display: t('dashboard.reports.last_3_months', { defaultValue: 'Últimos 3 Meses' })
        };
    }

    // Fallback seguro
    return {
        start: startOfMonth(today),
        end: endOfMonth(today),
        display: format(today, 'MMMM yyyy')
    };

  }, [selectedMonth, customStart, customEnd, i18n.language, t]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['financial-reports', user?.id, selectedMonth, customStart, customEnd, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      const businessId = member?.business_id;
      if (!businessId) return null;

      const { data, error } = await supabase
        .from('appointments')
        .select(`appointment_date, status, services ( name, price )`)
        .eq('business_id', businessId)
        .gte('appointment_date', dateRange.start.toISOString())
        .lte('appointment_date', dateRange.end.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && plan !== 'free' 
  });

  const stats = useMemo(() => {
    if (!reportData) return { revenue: 0, count: 0, ticket: 0, chartData: [], topServices: [] };

    let totalRevenue = 0;
    const serviceCount: Record<string, { count: number, value: number }> = {};
    const dailyRevenue: Record<string, number> = {};

    // Gera todos os dias do intervalo (mesmo os vazios)
    const daysInInterval = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    // Inicializa o mapa de dias com 0
    daysInInterval.forEach(day => {
      dailyRevenue[format(day, 'yyyy-MM-dd')] = 0;
    });

    reportData.forEach((app: any) => {
      const price = app.services?.price || 0;
      const serviceName = app.services?.name || 'Desconhecido';
      // Ajuste de fuso horário simples removendo a parte da hora para garantir match com a chave
      const appDate = parseISO(app.appointment_date);
      const dateKey = format(appDate, 'yyyy-MM-dd');

      // Verifica se a data do agendamento está dentro do range gerado (segurança extra)
      if (dailyRevenue[dateKey] !== undefined) {
          totalRevenue += price;
          dailyRevenue[dateKey] += price;
      }

      if (!serviceCount[serviceName]) serviceCount[serviceName] = { count: 0, value: 0 };
      serviceCount[serviceName].count += 1;
      serviceCount[serviceName].value += price;
    });

    // --- CORREÇÃO DO EIXO X ---
    // Usamos dd/MM para que dias de meses diferentes não se misturem
    const chartData = daysInInterval.map(day => ({
      name: format(day, 'dd/MM'), // Ex: 15/01
      fullDate: format(day, 'dd/MM/yyyy'),
      value: dailyRevenue[format(day, 'yyyy-MM-dd')] || 0
    }));

    const topServices = Object.entries(serviceCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      revenue: totalRevenue,
      count: reportData.length,
      ticket: reportData.length > 0 ? totalRevenue / reportData.length : 0,
      chartData,
      topServices
    };
  }, [reportData, dateRange]);

  const currencyFormatter = new Intl.NumberFormat(i18n.language === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: i18n.language === 'pt' ? 'BRL' : 'USD'
  });

  if (plan === 'free') {
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900">
        <div className="absolute inset-0 filter blur-md opacity-30 p-8 grid gap-8 pointer-events-none">
           <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-slate-700 rounded-xl"></div>
              <div className="h-32 bg-slate-700 rounded-xl"></div>
              <div className="h-32 bg-slate-700 rounded-xl"></div>
           </div>
           <div className="h-64 bg-slate-700 rounded-xl"></div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 backdrop-blur-sm z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t('dashboard.financial.locked_title', { defaultValue: 'Desbloqueie o Controle Financeiro' })}
          </h2>
          <p className="text-slate-400 max-w-md mb-8">
            {t('dashboard.financial.locked_desc', { defaultValue: 'Saiba exatamente quanto você ganha e quais serviços vendem mais com o Plano PRO.' })}
          </p>
          <Button 
            size="lg" 
            className="font-bold text-lg px-8 shadow-xl bg-primary hover:bg-primary/90 text-slate-900"
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t('dashboard.banner.cta', { defaultValue: 'Ver Planos & Preços' })}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print:space-y-4 print:p-0">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white print:text-black">{t('dashboard.reports.title', { defaultValue: 'Relatórios Financeiros' })}</h2>
          <p className="text-slate-400 capitalize print:text-slate-600">{dateRange.display}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto print:hidden">
          
          {selectedMonth === 'custom' && (
             <div className="flex gap-2 items-center bg-slate-800 p-1 px-3 rounded-md border border-white/10 animate-in slide-in-from-right-5">
                <input 
                    type="date" 
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none py-1 color-scheme-dark [color-scheme:dark]"
                />
                <span className="text-slate-500">-</span>
                <input 
                    type="date" 
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none py-1 color-scheme-dark [color-scheme:dark]"
                />
             </div>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white text-slate-900 border-none">
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900">
                <SelectItem value="0" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.current_month', { defaultValue: 'Mês Atual' })}</SelectItem>
                <SelectItem value="1" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.last_month', { defaultValue: 'Mês Passado' })}</SelectItem>
                <SelectItem value="3" className="focus:bg-slate-100 cursor-pointer">{t('dashboard.reports.last_3_months', { defaultValue: 'Últimos 3 Meses' })}</SelectItem>
                <SelectItem value="custom" className="focus:bg-slate-100 cursor-pointer font-bold text-primary">{t('dashboard.reports.custom', { defaultValue: 'Personalizado' })}</SelectItem>
              </SelectContent>
            </Select>

            <Button 
                variant="secondary" 
                onClick={() => window.print()} 
                className="bg-slate-800 text-white hover:bg-slate-700 border border-white/10"
                title="Imprimir Relatório"
            >
                <Printer className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('common.print', { defaultValue: 'Imprimir' })}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/90 to-primary/70 text-slate-900 border-0 shadow-xl relative overflow-hidden print:border print:border-slate-300 print:bg-white print:text-black">
          <div className="absolute top-0 right-0 p-4 opacity-20 print:hidden">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-slate-800 text-sm font-bold mb-1 opacity-80 print:text-black">{t('dashboard.reports.total_revenue', { defaultValue: 'Faturamento Total' })}</p>
          <h3 className="text-3xl font-extrabold print:text-black">{currencyFormatter.format(stats.revenue)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-900 bg-white/30 w-fit px-2 py-1 rounded-full font-medium print:hidden">
            <TrendingUp className="w-3 h-3" />
            <span>{t('dashboard.reports.real_data', { defaultValue: 'Dados reais' })}</span>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800 border-white/10 shadow-sm flex flex-col justify-center print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center print:bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-400 print:text-blue-700" />
            </div>
            <div>
              <p className="text-slate-400 text-sm print:text-slate-600">{t('dashboard.calendar.total', { defaultValue: 'Agendamentos' })}</p>
              <h3 className="text-2xl font-bold text-white print:text-black">{stats.count}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-slate-800 border-white/10 shadow-sm flex flex-col justify-center print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center print:bg-emerald-100">
              <CreditCard className="w-6 h-6 text-emerald-400 print:text-emerald-700" />
            </div>
            <div>
              <p className="text-slate-400 text-sm print:text-slate-600">{t('dashboard.reports.ticket_avg', { defaultValue: 'Ticket Médio' })}</p>
              <h3 className="text-2xl font-bold text-white print:text-black">{currencyFormatter.format(stats.ticket)}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 print:block print:space-y-6">
        <Card className="lg:col-span-2 p-6 border-white/10 bg-slate-800 shadow-sm print:bg-white print:border-slate-300 print:text-black print:mb-6">
          <h4 className="font-bold text-white mb-6 print:text-black">{t('dashboard.reports.daily_revenue', { defaultValue: 'Receita Diária' })}</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} // Fonte menor para caber mais datas
                  dy={10}
                  interval="preserveStartEnd" // Evita que datas se sobreponham demais
                  minTickGap={15} // Garante um espaço mínimo entre as datas
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                  itemStyle={{ color: '#3aed0d' }}
                  formatter={(value: number) => [currencyFormatter.format(value), t('dashboard.reports.revenue', {defaultValue: 'Receita'})]}
                  labelFormatter={(label) => `${t('common.day', {defaultValue: 'Dia'})} ${label}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f59e0b' : '#334155'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-slate-800 shadow-sm print:bg-white print:border-slate-300 print:text-black">
          <h4 className="font-bold text-white mb-4 print:text-black">{t('dashboard.reports.top_services', { defaultValue: 'Top Serviços' })}</h4>
          <div className="space-y-4">
            {stats.topServices.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">{t('dashboard.reports.no_data', { defaultValue: 'Nenhum dado ainda.' })}</p>
            ) : (
              stats.topServices.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/10 transition-colors print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold print:bg-slate-200 print:text-black">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 print:text-black">{service.name}</p>
                      <p className="text-xs text-slate-500 print:text-slate-600">{service.count} {t('common.sales', { defaultValue: 'vendas' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary print:text-black">
                    {currencyFormatter.format(service.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}