import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Clock, Copy, Link as LinkIcon, Image as ImageIcon, UploadCloud, Save, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function AvailabilitySettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingDay, setEditingDay] = useState<any>(null);
  const [times, setTimes] = useState({ start: '', end: '' });
  
  // Estados Locais
  const [uploading, setUploading] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [businessName, setBusinessName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daysOfWeek = [
    { id: 0, label: t('common.weekdays.0') },
    { id: 1, label: t('common.weekdays.1') },
    { id: 2, label: t('common.weekdays.2') },
    { id: 3, label: t('common.weekdays.3') },
    { id: 4, label: t('common.weekdays.4') },
    { id: 5, label: t('common.weekdays.5') },
    { id: 6, label: t('common.weekdays.6') },
  ];

  // Busca Perfil
  const { data: profile } = useQuery({
    queryKey: ['my-profile-settings', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('business_profiles')
        .select('slug, banner_url, business_name')
        .eq('user_id', user?.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setSlugValue(profile.slug || '');
      setBusinessName(profile.business_name || '');
    }
  }, [profile]);

  const { data: availability } = useQuery({
    queryKey: ['availability', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw error;
      return data;
    },
  });

  const baseUrl = window.location.origin;
  const finalSlug = slugValue || profile?.slug || user?.id; 
  const publicUrl = `${baseUrl}/${finalSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado!');
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
        const cleanSlug = slugValue.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const { error } = await supabase
            .from('business_profiles')
            .update({ 
              slug: cleanSlug,
              business_name: businessName
            })
            .eq('user_id', user?.id);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-profile-settings'] });
        toast.success(t('common.save') + '!');
    },
    onError: () => toast.error(t('auth.error_generic'))
  });

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('salon-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('salon-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('business_profiles')
        .update({ banner_url: urlData.publicUrl })
        .eq('user_id', user?.id);

      if (dbError) throw dbError;

      toast.success('Banner atualizado!');
      queryClient.invalidateQueries({ queryKey: ['my-profile-settings'] });

    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleDayMutation = useMutation({
    mutationFn: async ({ dayId, currentStatus }: { dayId: number, currentStatus: boolean }) => {
      const setting = availability?.find(a => a.day_of_week === dayId);
      if (setting) {
        await supabase.from('availability_settings').update({ is_active: !currentStatus }).eq('id', setting.id);
      } else {
        await supabase.from('availability_settings').insert({
          user_id: user?.id,
          day_of_week: dayId,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability'] }),
  });

  const updateTimeMutation = useMutation({
    mutationFn: async () => {
      if (!editingDay) return;
      const setting = availability?.find(a => a.day_of_week === editingDay.id);
      if (setting) {
        await supabase.from('availability_settings').update({ start_time: times.start, end_time: times.end, is_active: true }).eq('id', setting.id);
      } else {
        await supabase.from('availability_settings').insert({
          user_id: user?.id,
          day_of_week: editingDay.id,
          start_time: times.start,
          end_time: times.end,
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setEditingDay(null);
      toast.success(t('common.save') + '!');
    },
  });

  const openEditModal = (day: any) => {
    const setting = availability?.find(a => a.day_of_week === day.id);
    setEditingDay(day);
    setTimes({
      start: setting?.start_time || '09:00',
      end: setting?.end_time || '18:00'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div>
        <h2 className="text-2xl font-bold text-white">{t('dashboard.settings.title')}</h2>
        <p className="text-gray-400">{t('dashboard.settings.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* --- DADOS DO NEGÓCIO --- */}
        <Card className="p-6 bg-[#1e293b] border-white/10 flex flex-col gap-6">
          
          <div>
             <div className="flex items-center gap-2 text-primary font-medium mb-2">
                <Store className="w-5 h-5" />
                <h3>{t('dashboard.settings.business_name')}</h3>
             </div>
             <div className="flex gap-2">
                <input 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ex: Studio VIP"
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                />
             </div>
          </div>

          <div>
             <div className="flex items-center gap-2 text-primary font-medium mb-2">
                <LinkIcon className="w-5 h-5" />
                <h3>{t('dashboard.settings.link_title')}</h3>
             </div>
             <div className="flex gap-2 mb-2">
                <span className="flex items-center px-3 bg-black/20 border border-white/10 rounded-l-lg text-sm text-gray-400 border-r-0">
                    beautybook.app/
                </span>
                <input 
                    value={slugValue}
                    onChange={(e) => setSlugValue(e.target.value)}
                    placeholder="nome-do-salao"
                    className="flex-1 bg-black/20 border border-white/10 rounded-r-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                />
             </div>
             
             <div className="flex gap-2 items-center p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <p className="text-xs text-primary flex-1 font-mono truncate">
                    {publicUrl}
                </p>
                <Button onClick={handleCopyLink} variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-white hover:bg-primary/20">
                    <Copy className="w-3 h-3" />
                </Button>
             </div>
          </div>

          <Button 
            onClick={() => updateProfileMutation.mutate()} 
            className="w-full bg-primary hover:bg-primary/90 text-gray-900 font-bold"
          >
            <Save className="w-4 h-4 mr-2" /> {t('dashboard.settings.save_btn')}
          </Button>
        </Card>

        {/* --- BANNER --- */}
        <Card className="p-6 bg-[#1e293b] border-white/10 overflow-hidden relative">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary font-medium">
                <ImageIcon className="w-5 h-5" />
                <h3>{t('dashboard.settings.banner_title')}</h3>
              </div>
              {uploading && <span className="text-xs text-yellow-500 animate-pulse">{t('auth.btn_loading')}</span>}
           </div>

           <div 
             className="w-full h-40 rounded-lg bg-black/30 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-black/40 transition-colors relative group overflow-hidden"
             onClick={() => fileInputRef.current?.click()}
           >
              {profile?.banner_url ? (
                <>
                  <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                     <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                        <UploadCloud className="w-3 h-3" /> {t('common.update')}
                     </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                   <UploadCloud className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                   <p className="text-xs text-gray-400">{t('dashboard.settings.upload_text')}</p>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploading}
              />
           </div>
           <p className="text-xs text-gray-500 mt-3 text-center">{t('dashboard.settings.banner_help')}</p>
        </Card>
      </div>

      {/* --- HORÁRIOS --- */}
      <div className="mt-8 mb-4">
          <h3 className="text-lg font-bold text-white">{t('dashboard.settings.operating_hours')}</h3>
          <p className="text-sm text-gray-400">{t('dashboard.settings.operating_subtitle')}</p>
      </div>

      <div className="space-y-3">
        {daysOfWeek.map((day) => {
          const setting = availability?.find(a => a.day_of_week === day.id);
          const isActive = setting?.is_active ?? false;
          const startTime = setting?.start_time?.slice(0, 5) || '09:00';
          const endTime = setting?.end_time?.slice(0, 5) || '18:00';

          return (
            <Card key={day.id} className={`p-4 transition-all border-white/10 bg-[#1e293b] ${isActive ? 'border-l-4 border-l-primary' : 'opacity-70'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={isActive}
                    onCheckedChange={() => toggleDayMutation.mutate({ dayId: day.id, currentStatus: isActive })}
                  />
                  <div>
                    <span className="font-bold text-white block">{day.label}</span>
                    {isActive ? (
                       <span className="text-sm text-gray-400 flex items-center gap-1">
                         <Clock className="w-3 h-3" /> {startTime} - {endTime}
                       </span>
                    ) : (
                       <span className="text-sm text-gray-500">{t('dashboard.settings.closed')}</span>
                    )}
                  </div>
                </div>

                <Dialog open={editingDay?.id === day.id} onOpenChange={(open) => !open && setEditingDay(null)}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(day)} className="text-gray-400 hover:text-white hover:bg-white/5">
                      {t('common.edit')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1e293b] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>{day.label}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">{t('dashboard.settings.label_open')}</label>
                        <Input 
                          type="time" 
                          value={times.start} 
                          onChange={(e) => setTimes({...times, start: e.target.value})}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase text-gray-400 font-bold">{t('dashboard.settings.label_close')}</label>
                        <Input 
                          type="time" 
                          value={times.end} 
                          onChange={(e) => setTimes({...times, end: e.target.value})}
                          className="bg-black/20 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={() => updateTimeMutation.mutate()} className="w-full bg-primary text-gray-900 font-bold hover:bg-primary/90">
                      {t('dashboard.settings.btn_save_time')}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}