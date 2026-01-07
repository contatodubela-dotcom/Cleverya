import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sparkles, Calendar, Clock, CheckCircle, ArrowLeft, Star, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Service, AvailabilitySetting } from '../types';

// --- TIPAGEM ATUALIZADA DO PERFIL ---
interface BusinessProfile {
  user_id: string;
  business_name: string;
  banner_url: string | null; // Nova coluna
}

interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

const generateGoogleCalendarUrl = (serviceName: string, date: string, time: string, duration: number) => {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + duration * 60000);
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName)}&dates=${formatDate(start)}/${formatDate(end)}&details=Agendamento+confirmado+via+BeautyBook`;
};

// --- WRAPPER PARA RESOLVER O LINK ---
export default function BookingPage() {
  const params = useParams();
  const paramId = params.userId;
  const paramSlug = params.slug;

  const [resolvedUserId, setResolvedUserId] = useState<string | null>(paramId || null);
  // Estado agora guarda o perfil completo
  const [profileData, setProfileData] = useState<BusinessProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function resolveProfile() {
      setLoadingProfile(true);
      let userIdToFetch = paramId;

      // 1. Se veio por SLUG, descobre o ID
      if (paramSlug && !paramId) {
        const { data: slugData } = await supabase
          .from('business_profiles')
          .select('user_id')
          .eq('slug', paramSlug)
          .maybeSingle();
        
        if (slugData) {
          userIdToFetch = slugData.user_id;
        } else {
           setLoadingProfile(false);
           return; // Slug não encontrado
        }
      }

      // 2. Com o ID na mão, busca os dados do perfil (Nome e Banner)
      if (userIdToFetch) {
          setResolvedUserId(userIdToFetch);
          const { data: profile } = await supabase
              .from('business_profiles')
              .select('user_id, business_name, banner_url')
              .eq('user_id', userIdToFetch)
              .maybeSingle();
          
          if (profile) {
              setProfileData(profile as BusinessProfile);
          }
      }
      setLoadingProfile(false);
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

  if (!resolvedUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] text-slate-500">
        <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold">Página não encontrada</h2>
        <p>Verifique o endereço digitado.</p>
      </div>
    );
  }

  return <BookingContent userId={resolvedUserId} profile={profileData} />;
}

// --- CONTEÚDO DA PÁGINA ---
function BookingContent({ userId, profile }: { userId: string, profile: BusinessProfile | null }) {
  const [step, setStep] = useState<'service' | 'datetime' | 'info' | 'success'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const businessName = profile?.business_name || 'Agendar Horário';
  // URL da imagem ou um fallback se não tiver
  const bannerUrl = profile?.banner_url;

  // ... (MANTENHA TODAS AS QUERIES E MUTATIONS IGUAIS AO CÓDIGO ANTERIOR: services, professionals, availability, appointmentCounts, createAppointmentMutation, funções de data/hora) ...
  // POR QUESTÃO DE ESPAÇO, NÃO VOU REPETIR A LÓGICA DE AGENDA AQUI, POIS ELA NÃO MUDA.
  // VOCÊ DEVE MANTER O CÓDIGO DAS LINHAS 110 ATÉ 315 DO CÓDIGO ANTERIOR AQUI DENTRO.
  
  // PARA TESTAR RÁPIDO, SE NÃO QUISER COPIAR TUDO DE NOVO, USE O BLOCO ABAIXO NO LUGAR:
  /*
  // MOCKS PARA TESTE VISUAL (Remova isso e use suas queries reais depois)
  const groupedServices = { 'Bronze': [{ id: '1', name: 'Bronzeamento Gelado', price: 120, duration_minutes: 60 }] };
  const professionals = [{ id: 'p1', name: 'Glaucia', capacity: 1 }];
  const getAvailableDates = () => ['2023-10-20', '2023-10-21'];
  const getAvailableTimeSlots = () => ['09:00', '10:00'];
  const createAppointmentMutation = { mutate: () => setStep('success'), isPending: false };
  const handleDateTimeConfirm = () => setStep('info');
  const handleSubmit = (e) => { e.preventDefault(); setStep('success'); }
  */

  // 1. BUSCA SERVIÇOS
  const { data: services } = useQuery({
    queryKey: ['public-services', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('category', { ascending: true }) 
        .order('price', { ascending: true });   
      if (error) throw error;
      return data as Service[];
    },
  });

  const groupedServices = useMemo(() => {
    if (!services) return {};
    return services.reduce((acc, service) => {
      const cat = service.category || 'Geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  // 2. BUSCA PROFISSIONAIS
  const { data: professionals } = useQuery({
    queryKey: ['public-professionals', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (error) return [];
      return data as Professional[];
    },
  });

  // 3. BUSCA DISPONIBILIDADE
  const { data: availability } = useQuery({
    queryKey: ['public-availability', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      if (error) throw error;
      return data as AvailabilitySetting[];
    },
  });

  // 4. BUSCA AGENDAMENTOS (Contagem)
  const { data: appointmentCounts } = useQuery({
    queryKey: ['appointments-count', userId, selectedDate, selectedProfessional?.id],
    queryFn: async () => {
      if (!selectedDate || !selectedProfessional) return {};
      
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('user_id', userId)
        .eq('professional_id', selectedProfessional.id)
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'confirmed']); 
        
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((app: any) => {
        const timeKey = app.appointment_time.slice(0, 5); 
        counts[timeKey] = (counts[timeKey] || 0) + 1;
      });
      return counts;
    },
    enabled: !!selectedDate && !!selectedProfessional,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      let clientId;
      const { data: existingClient } = await supabase.from('clients').select('id').eq('phone', clientPhone).single();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ name: clientName, phone: clientPhone }).select().single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const { data: blocked } = await supabase.from('blocked_clients').select('id').eq('user_id', userId).eq('client_id', clientId).maybeSingle();
      if (blocked) throw new Error('Entre em contato com o estabelecimento.');

      const { error } = await supabase.from('appointments').insert({
        user_id: userId,
        client_id: clientId,
        service_id: selectedService!.id,
        professional_id: selectedProfessional!.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStep('success');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar agendamento');
    },
  });

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const dayOfWeek = date.getDay();
      const hasAvailability = availability?.some(a => a.day_of_week === dayOfWeek);
      if (hasAvailability) dates.push(format(date, 'yyyy-MM-dd'));
    }
    return dates;
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate || !availability || !selectedProfessional) return [];
    
    const dateObj = parseISO(selectedDate); 
    const dayOfWeek = dateObj.getDay(); 
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvailability) return [];

    const now = new Date();
    const isToday = isSameDay(dateObj, now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const slots = [];
    const [startHour, startMinute] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end_time.split(':').map(Number);
    
    let loopHour = startHour;
    let loopMinute = startMinute;

    while (loopHour < endHour || (loopHour === endHour && loopMinute < endMinute)) {
      const timeString = `${String(loopHour).padStart(2, '0')}:${String(loopMinute).padStart(2, '0')}`;
      let isPast = false;
      if (isToday) {
        if (loopHour < currentHour || (loopHour === currentHour && loopMinute <= currentMinute)) isPast = true;
      }
      const currentCount = appointmentCounts?.[timeString] || 0;
      const capacity = selectedProfessional.capacity || 1;
      const isFull = currentCount >= capacity;

      if (!isPast && !isFull) slots.push(timeString);

      loopMinute += 30;
      if (loopMinute >= 60) {
        loopMinute = 0;
        loopHour++;
      }
    }
    return slots;
  };

  const handleDateTimeConfirm = () => {
    if (selectedDate && selectedTime && selectedProfessional) setStep('info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAppointmentMutation.mutate();
  };


  // --- RENDERIZAÇÃO ---
  return (
    // MUDANÇA 1: Fundo agora é um gradiente sutil "Champagne" (muito mais chique que o cinza)
    <div className="min-h-screen bg-gradient-to-br from-[#fffbf0] via-[#fff5f5] to-[#fff0f0] flex flex-col items-center justify-start pb-12 font-sans text-slate-900">
      
      {/* BANNER DE FUNDO */}
      <div 
        className={`w-full h-64 md:h-80 shadow-lg bg-cover bg-center relative transition-all duration-500 ${!bannerUrl ? 'bg-gradient-to-r from-amber-200 to-orange-100' : ''}`}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
      </div>

      <div className="w-full max-w-lg px-4 -mt-32 relative z-10">
        
        {/* CABEÇALHO DO SALÃO (CARD FLUTUANTE) */}
        {/* MUDANÇA 2: Bordas mais suaves e quentes (stone-100 em vez de slate-200) */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-6 mb-8 text-center border border-white/50 relative overflow-hidden">
          
          <div className="w-28 h-28 bg-white rounded-full mx-auto -mt-20 flex items-center justify-center shadow-2xl border-4 border-white">
             <div className="w-full h-full rounded-full bg-[#fffbf0] flex items-center justify-center overflow-hidden">
                <Sparkles className="w-12 h-12 text-[#d4af37]" /> {/* Dourado */}
             </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mt-4 tracking-tight">{businessName}</h1>
          <p className="text-sm text-slate-500 flex items-center justify-center gap-1 mt-2 uppercase tracking-widest font-medium">
            <Star className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
            Experiência Premium
          </p>

          {step !== 'success' && step !== 'service' && (
            <button 
              onClick={() => setStep(step === 'info' ? 'datetime' : 'service')} 
              className="absolute top-4 left-4 text-slate-400 hover:text-[#d4af37] transition-colors bg-white/80 p-2 rounded-full hover:bg-white shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-8">
          
          {/* TÍTULO DA ETAPA (Estilo mais limpo) */}
          <div className="text-center">
             <h2 className="text-xl font-medium text-slate-700">
                {step === 'service' && 'Qual procedimento você deseja?'}
                {step === 'datetime' && 'Escolha o melhor horário'}
                {step === 'info' && 'Confirme seus dados'}
                {step === 'success' && 'Agendamento Confirmado!'}
             </h2>
             <div className="h-0.5 w-16 bg-[#d4af37]/30 mx-auto rounded-full mt-3"></div>
          </div>

          {step === 'service' && (
            <div className="space-y-8 animate-fade-in">
              {Object.entries(groupedServices).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-[#d4af37] uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]"></span>
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {items.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setStep('datetime');
                          setSelectedProfessional(null);
                          setSelectedDate('');
                          setSelectedTime('');
                        }}
                        className="group relative flex items-center p-5 bg-white rounded-2xl border border-[#f5f0e6] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:border-[#d4af37]/30 hover:shadow-lg transition-all text-left w-full overflow-hidden"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className="font-bold text-slate-800 text-lg group-hover:text-[#d4af37] transition-colors">
                               {service.name}
                             </span>
                             {service.price && (
                               <span className="font-medium text-slate-900 bg-[#fffbf0] px-3 py-1 rounded-full text-sm border border-[#f5f0e6]">
                                 R$ {service.price.toFixed(2)}
                               </span>
                             )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 font-medium">
                            <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} minutos de sessão
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'datetime' && (
            <div className="bg-white rounded-3xl border border-[#f5f0e6] shadow-xl p-6 animate-fade-in space-y-8">
              {/* Mantive a lógica funcional, só limpei o visual */}
              <div>
                <label className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  1. Profissional
                </label>
                
                {(!professionals || professionals.length === 0) ? (
                   <p className="text-sm text-red-500">Nenhum profissional disponível.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {professionals.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setSelectedProfessional(prof);
                          setSelectedDate('');
                          setSelectedTime('');
                        }}
                        className={`
                          p-4 rounded-xl border text-left transition-all relative
                          ${selectedProfessional?.id === prof.id 
                            ? 'bg-[#fffbf0] border-[#d4af37] text-slate-900 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-100 hover:border-[#d4af37]/30'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{prof.name}</span>
                            {selectedProfessional?.id === prof.id && (
                                <CheckCircle className="w-5 h-5 text-[#d4af37]" />
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProfessional && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <label className="text-sm font-bold text-slate-900 mb-4 block uppercase tracking-wide">2. Data</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {getAvailableDates().map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                              setSelectedDate(date);
                              setSelectedTime('');
                          }}
                          className={`
                            min-w-[5rem] p-4 rounded-2xl flex flex-col items-center justify-center transition-all border
                            ${selectedDate === date 
                              ? 'bg-slate-800 text-white border-slate-800 shadow-lg transform -translate-y-1' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-[#d4af37]/50'}
                          `}
                        >
                          <span className="text-[10px] uppercase font-bold mb-1 opacity-80">{format(parseISO(date), 'EEE', { locale: ptBR })}</span>
                          <span className="text-2xl font-black">{format(parseISO(date), 'dd')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="animate-fade-in">
                      <label className="text-sm font-bold text-slate-900 mb-4 block uppercase tracking-wide">
                        3. Horário
                      </label>
                      {getAvailableTimeSlots().length === 0 ? (
                          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center border border-red-100">
                             Sem horários livres.
                          </div>
                      ) : (
                          <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {getAvailableTimeSlots().map((time) => (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`
                                  py-3 rounded-xl text-sm font-bold transition-all border
                                  ${selectedTime === time 
                                    ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-md' 
                                    : 'bg-white text-slate-600 border-slate-100 hover:border-[#d4af37] hover:text-[#d4af37]'}
                                `}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-xl shadow-xl text-lg mt-6" 
                disabled={!selectedDate || !selectedTime || !selectedProfessional}
                onClick={handleDateTimeConfirm}
              >
                Continuar
              </Button>
            </div>
          )}

          {step === 'info' && (
            <Card className="p-0 animate-fade-in border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
              <div className="bg-[#fffbf0] p-6 border-b border-[#f5f0e6]">
                  <h3 className="font-bold text-[#d4af37] mb-4 text-xs uppercase tracking-widest">Resumo do Pedido</h3>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                       <span className="font-playfair font-bold text-slate-900 text-2xl block">{selectedService?.name}</span>
                       <span className="text-sm text-slate-500 block mt-1">Profissional: {selectedProfessional?.name}</span>
                     </div>
                     <span className="font-bold text-slate-900 text-xl">R$ {selectedService?.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 mt-4 bg-white/50 p-3 rounded-lg w-fit">
                      <Calendar className="w-4 h-4" />
                      <span className="capitalize font-medium">{selectedDate && format(parseISO(selectedDate), "EEE, dd/MM", { locale: ptBR })}</span>
                      <span className="mx-1">•</span>
                      <span>{selectedTime}</span>
                  </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Seu Nome</label>
                    <Input 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)} 
                      placeholder="Ex: Maria Silva" 
                      required 
                      // CORRIGIDO AQUI: !text-slate-900 para garantir texto preto
                      className="bg-slate-50 border-slate-200 h-14 rounded-xl focus:ring-[#d4af37] !text-slate-900 placeholder:text-slate-400" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">WhatsApp</label>
                    <Input 
                      value={clientPhone} 
                      onChange={(e) => setClientPhone(e.target.value)} 
                      placeholder="(11) 99999-9999" 
                      required 
                      // CORRIGIDO AQUI TAMBÉM
                      className="bg-slate-50 border-slate-200 h-14 rounded-xl focus:ring-[#d4af37] !text-slate-900 placeholder:text-slate-400" 
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c5a028] text-white font-bold h-14 rounded-xl shadow-lg text-lg" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending ? 'Confirmando...' : 'Confirmar Agendamento'}
                </Button>
              </form>
            </Card>
          )}
          {step === 'success' && (
            <Card className="p-10 text-center animate-fade-in bg-white border-0 shadow-2xl rounded-3xl">
               <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6 ring-8 ring-green-50/30">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-slate-900 tracking-tight">Agendado!</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Tudo certo, <strong className="text-slate-900">{clientName.split(' ')[0]}</strong>.<br/>
                Seu horário para <strong>{selectedService?.name}</strong> está reservado.
              </p>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 h-14 rounded-xl" onClick={() => window.open(generateGoogleCalendarUrl(selectedService?.name || '', selectedDate, selectedTime, selectedService?.duration_minutes || 60), '_blank')}>
                  <Calendar className="w-4 h-4 mr-2" /> Adicionar à Agenda
                </Button>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-xl" onClick={() => window.location.reload()}>
                  Fazer outro agendamento
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}