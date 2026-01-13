import { useState, useEffect } from 'react';
import { format, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, PlayCircle, User as UserIcon } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Componente de Seleção de Período (CORRIGIDO PARA DARK MODE)
function RangeCalendar({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange,
  onQuickSelect 
}: { 
  startDate: string, 
  endDate: string, 
  onStartChange: (d: string) => void, 
  onEndChange: (d: string) => void,
  onQuickSelect: (type: 'today' | 'week') => void
}) {
  const { t } = useTranslation();
  return (
    // CORREÇÃO: bg-[#1e293b] e bordas claras
    <div className="p-4 bg-[#1e293b] rounded-xl border border-white/10 shadow-sm space-y-4">
      <div className="flex gap-2 mb-2">
        <Button variant="outline" size="sm" className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/10" onClick={() => onQuickSelect('today')}>
          {t('dashboard.calendar.today')}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/10" onClick={() => onQuickSelect('week')}>
          {t('dashboard.calendar.week')}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">{t('dashboard.calendar.from')}</label>
          {/* CORREÇÃO: Input com fundo escuro e texto branco + color-scheme para o ícone */}
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full p-2 border border-white/10 bg-black/20 rounded-md text-center text-sm text-white outline-none focus:ring-2 ring-primary/20 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">{t('dashboard.calendar.to')}</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full p-2 border border-white/10 bg-black/20 rounded-md text-center text-sm text-white outline-none focus:ring-2 ring-primary/20 [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
}

export default function CalendarView() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd')); 
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dateLocale = i18n.language === 'en' ? enUS : ptBR;

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        clients (name, phone),
        services (name, price, duration_minutes),
        professionals (name)
      `)
      .eq('user_id', user.id)
      .gte('appointment_date', startDate) 
      .lte('appointment_date', endDate)   
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error(error);
      toast.error(t('auth.error_generic'));
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [startDate, endDate, user]);

  const handleQuickSelect = (type: 'today' | 'week') => {
    const today = new Date();
    if (type === 'today') {
      const formatted = format(today, 'yyyy-MM-dd');
      setStartDate(formatted);
      setEndDate(formatted);
    } else {
      setStartDate(format(startOfWeek(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today), 'yyyy-MM-dd'));
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error(t('auth.error_generic'));
    } else {
      toast.success(t('common.save'));
      fetchAppointments(); 
    }
  };

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6 animate-fade-in">
      
      <div className="space-y-4">
        <RangeCalendar 
          startDate={startDate} 
          endDate={endDate} 
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onQuickSelect={handleQuickSelect}
        />
        
        {/* Card de Resumo - CORRIGIDO */}
        <Card className="p-4 bg-[#1e293b] border-white/10 text-white">
          <h3 className="font-semibold text-primary mb-2">{t('dashboard.calendar.summary')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.calendar.total')}:</span>
              <span className="font-bold">{appointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.overview.pending')}:</span>
              <span className="font-bold text-yellow-500">
                {appointments.filter(a => a.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.overview.confirmed')}:</span>
              <span className="font-bold text-green-500">
                {appointments.filter(a => a.status === 'confirmed').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-white">
            {t('dashboard.calendar.title')}
          </h2>
          <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading} className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10">
            {loading ? t('common.loading') : t('common.update')}
          </Button>
        </div>

        {appointments.length === 0 ? (
          // Estado Vazio - CORRIGIDO
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-[#1e293b] rounded-xl border border-dashed border-white/10">
            <CalendarIcon className="w-16 h-16 mb-4 text-gray-500 opacity-50" />
            <p className="text-lg font-medium">{t('dashboard.calendar.no_appointments')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((app) => (
              // Card de Agendamento - CORRIGIDO
              <Card key={app.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-white/5 transition-all bg-[#1e293b] border-white/10">
                
                <div className="flex gap-4">
                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-black/30 rounded-lg min-w-[90px] text-center border border-white/5">
                    <span className="text-xs font-bold uppercase text-gray-400">
                      {format(parseISO(app.appointment_date), 'dd MMM', { locale: dateLocale })}
                    </span>
                    <span className="text-xl font-bold text-white">
                      {app.appointment_time.slice(0, 5)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1
                      ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                      ${app.status === 'confirmed' ? 'bg-green-500/20 text-green-300' : ''}
                      ${app.status === 'completed' ? 'bg-blue-500/20 text-blue-300' : ''}
                      ${app.status === 'cancelled' ? 'bg-red-500/20 text-red-300' : ''}
                      ${app.status === 'no_show' ? 'bg-red-500/20 text-red-300' : ''}
                    `}>
                      {app.status === 'no_show' ? t('dashboard.overview.status_noshow') : app.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-white">{app.clients?.name || 'Cliente deletado'}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.services?.name}
                      </span>
                      <span>•</span>
                      
                      <span className="flex items-center gap-1 text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                         <UserIcon className="w-3 h-3" />
                         {app.professionals?.name || t('booking.no_prof')}
                      </span>
                      
                      <span>•</span>
                      <span>{app.services?.duration_minutes} min</span>
                      <span>•</span>
                      <span className="text-white font-medium">
                        {app.services?.price ? new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'pt-BR', { style: 'currency', currency: i18n.language === 'en' ? 'USD' : 'BRL' }).format(app.services.price) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto border-t border-white/10 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                  {app.status === 'pending' && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                      onClick={() => updateStatus(app.id, 'confirmed')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> {t('dashboard.overview.btn_confirm')}
                    </Button>
                  )}

                  {app.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none"
                      onClick={() => updateStatus(app.id, 'completed')}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" /> Finalizar
                    </Button>
                  )}

                  {['pending', 'confirmed'].includes(app.status) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-400 hover:bg-red-950/30 border-red-900/50 flex-1 md:flex-none"
                      onClick={() => updateStatus(app.id, 'cancelled')}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancelar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}