import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Loader2, Save, Clock, Copy, Store, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface DaySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function AvailabilitySettings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [branding, setBranding] = useState({
    business_name: '',
    slug: '',
    banner_url: ''
  });

  const days = [
    { id: 0, label: i18n.language === 'pt' ? 'Domingo' : 'Sunday' },
    { id: 1, label: i18n.language === 'pt' ? 'Segunda' : 'Monday' },
    { id: 2, label: i18n.language === 'pt' ? 'Terça' : 'Tuesday' },
    { id: 3, label: i18n.language === 'pt' ? 'Quarta' : 'Wednesday' },
    { id: 4, label: i18n.language === 'pt' ? 'Quinta' : 'Thursday' },
    { id: 5, label: i18n.language === 'pt' ? 'Sexta' : 'Friday' },
    { id: 6, label: i18n.language === 'pt' ? 'Sábado' : 'Saturday' },
  ];

  // --- BUSCA DADOS (CORRIGIDO) ---
  const getBusinessId = async () => {
    // 1. Tenta buscar direto na tabela de empresas (como Dono)
    const { data: bizData } = await supabase.from('businesses').select('id').eq('owner_id', user?.id).maybeSingle();
    if (bizData?.id) return bizData.id;

    // 2. Fallback: tenta buscar na tabela de membros (como Funcionário)
    const { data: memberData } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).maybeSingle();
    return memberData?.business_id;
  }

  const { data: profileData } = useQuery({
    queryKey: ['settings-branding', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .maybeSingle();
      
      if (error) console.error("Erro ao buscar perfil:", error);
      return data;
    },
    enabled: !!user?.id
  });

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['availability', user?.id],
    queryFn: async () => {
      const bid = await getBusinessId();
      if (!bid) return [];

      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('business_id', bid);

      if (error) throw error;
      return data as DaySchedule[];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileData) {
      setBranding({
        business_name: profileData.name || '',
        slug: profileData.slug || '',
        banner_url: profileData.banner_url || ''
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (serverSettings) {
      const mergedSchedule = days.map(day => {
        const existing = serverSettings.find(s => s.day_of_week === day.id);
        return existing || { day_of_week: day.id, start_time: '09:00:00', end_time: '18:00:00', is_active: day.id !== 0 && day.id !== 6 };
      });
      setSchedule(mergedSchedule);
    }
  }, [serverSettings, i18n.language]);

  // --- MUTAÇÕES ---
  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('businesses').update({
        name: branding.business_name,
        slug: branding.slug.toLowerCase(),
        banner_url: branding.banner_url
      }).eq('owner_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('toasts.profile_updated'));
      queryClient.invalidateQueries({ queryKey: ['settings-branding'] });
      queryClient.invalidateQueries({ queryKey: ['my-business-info'] });
    },
    onError: (err) => {
      console.error(err);
      toast.error(t('toasts.profile_error'));
    }
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (newSchedule: DaySchedule[]) => {
      const bid = await getBusinessId();
      if (!bid) throw new Error("Empresa não encontrada");

      const updates = newSchedule.map(item => ({
        business_id: bid,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: item.is_active
      }));

      const { error } = await supabase
        .from('availability_settings')
        .upsert(updates, { onConflict: 'business_id,day_of_week' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setHasChanges(false);
      toast.success(t('toasts.schedule_saved'));
    },
    onError: (err) => {
        console.error(err);
        toast.error(t('toasts.schedule_error'));
    }
  });

  const updateDay = (dayId: number, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => prev.map(day => day.day_of_week === dayId ? { ...day, [field]: value } : day));
    setHasChanges(true);
  };

  const copyToAll = (sourceDayId: number) => {
    const source = schedule.find(d => d.day_of_week === sourceDayId);
    if (!source) return;
    setSchedule(prev => prev.map(day => ({ ...day, start_time: source.start_time, end_time: source.end_time, is_active: source.is_active })));
    setHasChanges(true);
    toast.info(t('toasts.schedule_copied'));
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* SEÇÃO 1: BRANDING */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" /> {t('dashboard.settings.profile_title')}
            </h2>
            <p className="text-slate-400">{t('dashboard.settings.profile_desc')}</p>
          </div>
          <Button 
            onClick={() => saveBrandingMutation.mutate()} 
            disabled={saveBrandingMutation.isPending}
            className="bg-primary text-slate-900 font-bold hover:bg-primary/90"
          >
            {saveBrandingMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
            {t('dashboard.settings.btn_save_profile')}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-800 border-white/10 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t('dashboard.settings.business_name')}</label>
              <Input 
                value={branding.business_name}
                onChange={(e) => setBranding({...branding, business_name: e.target.value})}
                className="bg-white text-slate-900 font-medium border-slate-200"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{t('dashboard.settings.slug_label')}</label>
              <div className="flex items-center">
                <span className="bg-slate-700 text-slate-300 px-3 py-2 rounded-l-md border border-r-0 border-white/10 text-sm">cleverya.com/</span>
                <Input 
                  value={branding.slug}
                  onChange={(e) => setBranding({...branding, slug: e.target.value})}
                  className="bg-white text-slate-900 font-medium border-slate-200 rounded-l-none"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-800 border-white/10 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> {t('dashboard.settings.banner_label')}
              </label>
              <Input 
                value={branding.banner_url}
                placeholder="https://..."
                onChange={(e) => setBranding({...branding, banner_url: e.target.value})}
                className="bg-white text-slate-900 border-slate-200"
              />
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="text-amber-500 font-bold">Dica:</span> 
                Use uma imagem de <span className="text-white">1920x600px</span>. Mantenha o foco no centro.
              </p>
              <p className="text-xs text-slate-500 mt-2">{t('common.image_url_help')}</p>
            </div>
            {branding.banner_url && (
              <div className="h-24 w-full rounded-lg overflow-hidden border border-white/20 relative">
                <img src={branding.banner_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="border-t border-white/10 my-8"></div>

      {/* SEÇÃO 2: HORÁRIOS */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> {t('dashboard.settings.hours_title')}
            </h2>
            <p className="text-slate-400">{t('dashboard.settings.hours_desc')}</p>
          </div>
          
          <Button 
            onClick={() => saveScheduleMutation.mutate(schedule)} 
            disabled={!hasChanges || saveScheduleMutation.isPending}
            className="bg-slate-700 text-white hover:bg-slate-600"
          >
            {saveScheduleMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
            {t('dashboard.settings.btn_save_hours')}
          </Button>
        </div>

        <div className="grid gap-4">
          {schedule.map((day) => {
            const dayLabel = days.find(d => d.id === day.day_of_week)?.label;
            return (
              <Card key={day.day_of_week} className={`p-4 transition-all border-l-4 border-y-0 border-r-0 ${day.is_active ? 'border-l-primary bg-slate-800' : 'border-l-slate-600 opacity-50 bg-slate-900'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4 min-w-[150px]">
                    <Switch 
                      checked={day.is_active}
                      onCheckedChange={(checked) => updateDay(day.day_of_week, 'is_active', checked)}
                    />
                    <span className={`font-bold ${day.is_active ? 'text-white' : 'text-slate-500'}`}>
                      {dayLabel}
                    </span>
                  </div>
                  {day.is_active ? (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={day.start_time.slice(0, 5)} 
                          onChange={(e) => updateDay(day.day_of_week, 'start_time', e.target.value)}
                          className="w-32 bg-white text-slate-900 font-medium text-center"
                        />
                      </div>
                      <span className="text-slate-400 font-bold">-</span>
                      <div className="relative">
                        <Input 
                          type="time" 
                          value={day.end_time.slice(0, 5)} 
                          onChange={(e) => updateDay(day.day_of_week, 'end_time', e.target.value)}
                          className="w-32 bg-white text-slate-900 font-medium text-center"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => copyToAll(day.day_of_week)} className="text-slate-400 hover:text-primary ml-2" title={t('common.copy_all')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 text-right pr-12 text-sm font-medium text-slate-600 uppercase tracking-widest">
                      {t('common.closed', { defaultValue: 'Fechado' })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}