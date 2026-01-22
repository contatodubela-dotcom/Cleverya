import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sparkles, Clock, CheckCircle, ArrowLeft, Loader2, AlertTriangle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import NotFound from './NotFound';

// --- TIPAGEM INTERNA ---
interface BusinessInfo {
  id: string;
  owner_id: string;
  name: string;
  banner_url?: string;
  slug: string;
  plan_type?: string;
}

interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number;
  description?: string;
  category?: string;
}

interface AvailabilitySetting {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// --- COMPONENTE PRINCIPAL ---
export default function BookingPage() {
  const params = useParams();
  const paramId = params.userId; 
  const paramSlug = params.slug;

  const [businessData, setBusinessData] = useState<BusinessInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function resolveProfile() {
      setLoadingProfile(true);
      try {
        // 1. Tenta buscar na tabela NOVA (Businesses)
        if (paramSlug) {
          const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('slug', paramSlug.toLowerCase())
            .maybeSingle();
            
          if (data) {
            setBusinessData({
                id: data.id,
                owner_id: data.owner_id,
                name: data.name,
                slug: data.slug,
                plan_type: data.plan_type,
                banner_url: data.banner_url
            });
            setLoadingProfile(false);
            return;
          }
        }

        // 2. FALLBACK: Tabela Antiga
        let query = supabase.from('businesses').select('*');
        if (paramSlug) query = query.eq('slug', paramSlug.toLowerCase());
        else if (paramId) query = query.eq('user_id', paramId);
        
        const { data: oldProfile } = await query.maybeSingle();
        
        if (oldProfile) {
            const { data: newBiz } = await supabase
                .from('businesses')
                .select('id, plan_type, banner_url')
                .eq('owner_id', oldProfile.user_id)
                .maybeSingle();
            
            setBusinessData({
                id: newBiz?.id || oldProfile.user_id,
                owner_id: oldProfile.user_id,
                name: oldProfile.business_name,
                banner_url: newBiz?.banner_url || oldProfile.banner_url,
                slug: oldProfile.slug,
                plan_type: newBiz?.plan_type
            });
        }

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    resolveProfile();
  }, [paramId, paramSlug]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- CORREÇÃO AQUI ---
  // Se terminou de carregar e NÃO achou o business, retorna o componente NotFound oficial
  if (!businessData) {
    return <NotFound />;
  }

  return <BookingContent business={businessData} />;
}

// --- CONTEÚDO DO AGENDAMENTO ---
function BookingContent({ business }: { business: BusinessInfo }) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'en' ? enUS : ptBR;
  const currencyCode = i18n.language === 'en' ? 'USD' : 'BRL';
  const formatPrice = (price: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: currencyCode }).format(price);

  // --- 1. VERIFICAÇÃO DE PLANO E LIMITES ---
  const { data: usageMetrics } = useQuery({
    queryKey: ['public-usage-metrics', business.owner_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_usage_metrics', { target_user_id: business.owner_id });
      if (error) return null;
      return data as { appointments_used: number, current_plan: string };
    },
    enabled: !!business.owner_id
  });

  const currentPlan = usageMetrics?.current_plan || 'free';
  const isPremium = currentPlan === 'pro' || currentPlan === 'business';
  
  const isLimitReached = useMemo(() => {
    if (!usageMetrics) return false;
    if (currentPlan === 'free' && usageMetrics.appointments_used >= 50) {
        return true;
    }
    return false;
  }, [usageMetrics, currentPlan]);

  // ESTADOS
  const [step, setStep] = useState<'service' | 'datetime' | 'identification' | 'confirmation' | 'success'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [existingClient, setExistingClient] = useState<any>(null);

  const businessName = business.name || t('booking.default_business_name', { defaultValue: 'Agendamento Online' });
  const bannerUrl = business.banner_url || 'https://bxglxltapbagjmmkagfm.supabase.co/storage/v1/object/public/salon-images/Cleverya.png';

  // --- TELA DE BLOQUEIO ---
  if (isLimitReached) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t('booking.limit_title', { defaultValue: 'Agendamentos Pausados' })}
            </h1>
            <p className="text-slate-600 max-w-md mb-8">
                {t('booking.limit_desc', { defaultValue: 'Este estabelecimento atingiu o limite mensal de agendamentos.' })}
            </p>
        </div>
    );
  }

  // --- QUERIES DE DADOS ---
  const { data: services } = useQuery({
    queryKey: ['public-services', business.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('price');
      return data as Service[];
    },
  });

  const groupedServices = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      // 1. Pega a categoria do banco
      let cat = service.category;

      // 2. Lógica de Tradução:
      if (!cat || cat === 'Geral') {
          cat = t('booking.category_general', { defaultValue: 'Geral' });
      }

      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services, t, i18n.language]);

  const { data: professionals } = useQuery({
    queryKey: ['public-professionals', business.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('professionals')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true);
      return data as Professional[] || [];
    },
  });

  const { data: availability } = useQuery({
    queryKey: ['public-availability', business.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true);
      return data as AvailabilitySetting[];
    },
  });

 const { data: availableSlots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['available-slots', selectedProfessional?.id, selectedDate],
    queryFn: async () => {
      if (!selectedProfessional?.id || !selectedDate) return [];
      
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_professional_id: selectedProfessional.id,
        p_date: selectedDate,
        p_interval_minutes: selectedService?.duration_minutes || 30
      });

      if (error) {
        console.error('Error fetching slots:', error);
        toast.error(t('booking.error_fetch_slots', { defaultValue: 'Erro ao buscar horários' }));
        return [];
      }
      
      // --- CORREÇÃO DE HORÁRIO PASSADO ---
      const now = new Date();
      const isToday = parseISO(selectedDate).toDateString() === now.toDateString();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      return (data as { slot: string }[])
        .map(item => item.slot.slice(0, 5))
        .filter(time => {
            if (!isToday) return true; // Se não for hoje, mostra tudo
            
            const [h, m] = time.split(':').map(Number);
            const slotMinutes = h * 60 + m;
            
            // Bloqueia se o horário do slot for menor que "agora + 30 min de antecedência"
            return slotMinutes > currentMinutes; 
        });
    },
    enabled: !!selectedDate && !!selectedProfessional,
  });

  // --- HANDLERS ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPhone || clientPhone.length < 8) {
        toast.error(t('common.invalid_phone', { defaultValue: "Telefone inválido" }));
        return;
    }

    setIsCheckingPhone(true);
    try {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .eq('phone', clientPhone)
            .eq('business_id', business.id)
            .limit(1)
            .maybeSingle();

        if (data) {
            setExistingClient(data);
            setClientName(data.name);
            setClientEmail(data.email || '');
            toast.success(t('booking.welcome_back', { name: data.name.split(' ')[0], defaultValue: `Olá, ${data.name.split(' ')[0]}!` }));
        } else {
            setExistingClient(null);
            setClientName('');
            setClientEmail('');
        }
        setStep('confirmation');
    } catch (err) {
        toast.error(t('booking.error_verify', { defaultValue: 'Erro ao verificar' }));
    } finally {
        setIsCheckingPhone(false);
    }
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      let clientId = existingClient?.id;

      if (existingClient) {
         if (clientEmail !== existingClient.email) {
             await supabase.from('clients').update({ email: clientEmail }).eq('id', clientId);
         }
      } else {
         const { data: newClient, error } = await supabase.from('clients').insert({ 
             name: clientName, 
             phone: clientPhone, 
             email: clientEmail || null, 
             business_id: business.id 
         }).select().single();
         
         if (error) throw error;
         clientId = newClient.id;
      }

      // Verificação de Bloqueio
      const { data: blocked } = await supabase.from('blocked_clients').select('id').eq('client_id', clientId).maybeSingle();
      if (blocked) throw new Error('Blocked');

      const { error: appError } = await supabase.from('appointments').insert({ 
          business_id: business.id, 
          client_id: clientId, 
          service_id: selectedService!.id, 
          professional_id: selectedProfessional!.id, 
          appointment_date: selectedDate, 
          appointment_time: selectedTime, 
          status: 'pending' 
      });
      
      if (appError) throw appError;

      if (clientEmail) {
        supabase.functions.invoke('send-email', {
            body: {
                to: clientEmail,
                subject: `Confirmação: ${selectedService!.name}`,
                clientName: clientName,
                serviceName: selectedService!.name,
                date: format(parseISO(selectedDate), 'dd/MM/yyyy'),
                time: selectedTime,
                type: 'confirmation'
            }
        });
      }
    },
    onSuccess: () => setStep('success'),
    onError: (err: any) => {
        if (err.message === 'Blocked') toast.error(t('booking.blocked_error', { defaultValue: 'Você não pode agendar aqui.' }));
        else toast.error(t('auth.error_generic', { defaultValue: 'Erro ao agendar.' }));
    },
  });

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = date.getDay();
      if (availability?.some(a => a.day_of_week === dayOfWeek)) dates.push(format(date, 'yyyy-MM-dd'));
    }
    return dates;
  };

  const handleDateTimeConfirm = () => { if (selectedDate && selectedTime && selectedProfessional) setStep('identification'); }; 
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createAppointmentMutation.mutate(); };
  const handleBack = () => {
      if (step === 'identification') setStep('datetime');
      else if (step === 'confirmation') setStep('identification');
      else if (step === 'datetime') setStep('service');
  }

  const inputStyle = { backgroundColor: '#ffffff', color: '#000000', borderColor: '#e2e8f0', opacity: 1, WebkitTextFillColor: '#000000' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbf0] via-[#fff5f5] to-[#fff0f0] flex flex-col items-center justify-start pb-12 font-sans text-slate-900">
      
      <style>{`input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px white inset !important; -webkit-text-fill-color: black !important; }`}</style>

      {/* Seletor de Idioma */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
         <button onClick={() => i18n.changeLanguage('pt')} className={`text-xs p-2 rounded-full transition ${i18n.language === 'pt' ? 'bg-white shadow-md opacity-100' : 'bg-white/50 opacity-60 hover:opacity-100'}`}>🇧🇷</button>
         <button onClick={() => i18n.changeLanguage('en')} className={`text-xs p-2 rounded-full transition ${i18n.language === 'en' ? 'bg-white shadow-md opacity-100' : 'bg-white/50 opacity-60 hover:opacity-100'}`}>🇺🇸</button>
      </div>

      {/* BANNER DINÂMICO (COM GRADIENTE MAIS FORTE) */}
      <div 
        className="w-full h-64 md:h-80 shadow-lg bg-cover bg-center relative transition-all duration-500 overflow-hidden"
        style={
          bannerUrl 
            ? { backgroundImage: `url(${bannerUrl})` } 
            : { 
                // SE NÃO TIVER IMAGEM: Gera o padrão Cleverya via CSS (Ajustado para brilhar mais)
                background: `
                  radial-gradient(circle at 15% 25%, rgba(251, 191, 36, 0.35) 0%, rgba(15, 23, 42, 0) 45%),
                  radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.25) 0%, rgba(15, 23, 42, 0) 50%),
                  linear-gradient(to bottom right, #020617 0%, #1e293b 100%)
                `
              }
        }
      >
        {/* Textura de Grid (Pontinhos) - Deixei um pouco mais visível também */}
        {!bannerUrl && (
           <div 
             className="absolute inset-0 opacity-[0.15]" 
             style={{ 
               backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', 
               backgroundSize: '24px 24px' 
             }}
           ></div>
        )}

        {/* Gradiente preto na parte de baixo para o texto não sumir, mas mais suave no topo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      <div className="w-full max-w-lg px-4 -mt-32 relative z-10">
        
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 mb-8 text-center border border-white/50 relative overflow-hidden">
          <div className="w-28 h-28 bg-white rounded-full mx-auto -mt-20 flex items-center justify-center shadow-2xl border-4 border-white">
             <div className="w-full h-full rounded-full bg-[#fffbf0] flex items-center justify-center overflow-hidden">
                <Sparkles className="w-12 h-12 text-[#d4af37]" />
             </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">{businessName}</h1>
            
            {isPremium && (
                <div className="flex items-center justify-center gap-1 mt-2 text-[#d4af37] font-bold text-xs uppercase tracking-widest animate-pulse">
                    <Crown className="w-3 h-3 fill-current" />
                    <span>{t('booking.premium_exp', { defaultValue: 'Experiência Premium' })}</span>
                </div>
            )}
          </div>

          {step !== 'success' && step !== 'service' && (
            <button onClick={handleBack} className="absolute top-4 left-4 text-slate-400 hover:text-[#d4af37] transition-colors bg-white/80 p-2 rounded-full hover:bg-white shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="space-y-8">
          {step === 'service' && (
            <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-medium text-slate-700 text-center mb-6">{t('booking.step_service', { defaultValue: 'Selecione um serviço' })}</h2>
                {Object.entries(groupedServices).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-widest mb-3 ml-1">{category}</h3>
                  <div className="grid gap-3">
                    {items.map((service) => (
                      <button key={service.id} onClick={() => { setSelectedService(service); setStep('datetime'); setSelectedProfessional(null); setSelectedDate(''); setSelectedTime(''); }} className="flex items-center p-4 bg-white rounded-2xl border border-[#f5f0e6] shadow-sm hover:border-[#d4af37]/30 hover:shadow-md transition-all text-left w-full group">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-800 group-hover:text-[#d4af37] transition-colors">{service.name}</span>
                            {service.price && <span className="font-medium text-sm bg-slate-100 px-2 py-1 rounded text-slate-600">{formatPrice(service.price)}</span>}
                          </div>
                          {service.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{service.description}</p>}
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-2"><Clock className="w-3 h-3" /> {service.duration_minutes} min</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'datetime' && (
             <div className="bg-white rounded-3xl border border-[#f5f0e6] shadow-xl p-6 animate-fade-in space-y-6">
                <h2 className="text-lg font-bold text-center text-slate-800 mb-4">{t('booking.step_date', { defaultValue: 'Data & Hora' })}</h2>
                <div className="grid gap-2">
                    {professionals.map((prof) => (
                      <button key={prof.id} onClick={() => { setSelectedProfessional(prof); setSelectedDate(''); setSelectedTime(''); }} className={`p-3 rounded-xl border text-left transition-all flex justify-between items-center ${selectedProfessional?.id === prof.id ? 'bg-[#fffbf0] border-[#d4af37] text-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}>
                        <span className="font-bold text-sm">{prof.name}</span>{selectedProfessional?.id === prof.id && <CheckCircle className="w-4 h-4 text-[#d4af37]" />}
                      </button>
                    ))}
                </div>
                {selectedProfessional && (
                    <>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {getAvailableDates().map((date) => (
                                <button key={date} onClick={() => { setSelectedDate(date); setSelectedTime(''); }} className={`min-w-[4.5rem] p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${selectedDate === date ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                                    <span className="text-[10px] uppercase font-bold">{format(parseISO(date), 'EEE', { locale: dateLocale })}</span>
                                    <span className="text-xl font-black">{format(parseISO(date), 'dd')}</span>
                                </button>
                            ))}
                        </div>
                        {selectedDate && (
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                {isLoadingSlots ? <div className="col-span-3 py-4 flex justify-center"><Loader2 className="animate-spin text-[#d4af37]" /></div> : availableSlots?.length === 0 ? (
                                    <div className="col-span-3 text-center text-sm text-slate-400 py-4">{t('booking.no_slots', {defaultValue: 'Sem horários.'})}</div>
                                ) : availableSlots?.map((time) => (
                                    <button key={time} onClick={() => setSelectedTime(time)} className={`py-2 rounded-lg text-sm font-bold border transition-all ${selectedTime === time ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-[#d4af37]'}`}>{time}</button>
                                ))}
                            </div>
                        )}
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl mt-4" disabled={!selectedTime} onClick={handleDateTimeConfirm}>{t('booking.btn_continue', { defaultValue: 'Continuar' })}</Button>
                    </>
                )}
             </div>
          )}

          {step === 'identification' && (
             <Card className="p-8 animate-fade-in border-0 shadow-2xl bg-white rounded-3xl">
                <div className="text-center mb-6"><h3 className="text-lg font-bold text-slate-900">{t('booking.step_identification', { defaultValue: 'Identificação' })}</h3></div>
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" required className="h-14 text-center text-lg tracking-widest font-medium" style={inputStyle} />
                    <Button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-white font-bold h-12 rounded-xl" disabled={isCheckingPhone}>{isCheckingPhone ? <Loader2 className="animate-spin" /> : t('booking.btn_continue', { defaultValue: 'Continuar' })}</Button>
                </form>
             </Card>
          )}

          {step === 'confirmation' && (
             <Card className="p-6 animate-fade-in border-0 shadow-2xl bg-white rounded-3xl">
                <h3 className="text-center font-bold text-slate-900 mb-6">{t('booking.step_confirmation', { defaultValue: 'Confirmação' })}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t('booking.label_your_name', {defaultValue: 'Seu Nome'})} required className="h-12" style={inputStyle} />
                    <Input value={clientPhone} disabled className="h-12 bg-slate-50 opacity-70" style={inputStyle} />
                    <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t('booking.label_email_optional', {defaultValue: 'Email (Opcional)'})} className="h-12" style={inputStyle} />
                    <Button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-white font-bold h-12 rounded-xl" disabled={createAppointmentMutation.isPending}>{createAppointmentMutation.isPending ? t('booking.confirming', {defaultValue: 'Confirmando...'}) : t('booking.btn_confirm', { defaultValue: 'Confirmar' })}</Button>
                </form>
             </Card>
          )}

          {step === 'success' && (
             <Card className="p-8 text-center animate-fade-in bg-white border-0 shadow-2xl rounded-3xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('booking.success_title', { defaultValue: 'Agendado!' })}</h2>
                <p className="text-slate-500 mb-6">{t('booking.success_msg', { name: clientName.split(' ')[0], service: selectedService?.name, defaultValue: 'Tudo certo com seu agendamento.' })}</p>
                <Button className="w-full bg-slate-900 text-white h-12 rounded-xl" onClick={() => window.location.reload()}>{t('booking.btn_new', { defaultValue: 'Novo Agendamento' })}</Button>
             </Card>
          )}
        </div>

        {currentPlan === 'free' && (
            <div className="mt-12 text-center animate-fade-in pb-8">
                <a href="https://www.cleverya.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/20 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white transition-all shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    <span>Powered by <strong>Cleverya</strong></span>
                </a>
            </div>
        )}

      </div>
    </div>
  );
}