import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan'; 
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Trash2, Scissors, Plus, Clock, Loader2, FileText, Pencil, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ServiceForm {
  name: string;
  duration: string;
  price: string;
  category: string;
  description: string;
  require_deposit: boolean; 
}

export default function ServicesManager() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { plan } = usePlan(); 
  const queryClient = useQueryClient();
  
  const isPremium = plan === 'pro' || plan === 'business'; 

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const isPT = i18n.language?.startsWith('pt');
  const currencySymbol = isPT ? 'R$' : '$';
  const pricePlaceholder = isPT ? '0,00' : '0.00';

  const [form, setForm] = useState<ServiceForm>({
    name: '',
    duration: '30',
    price: '',
    category: 'Geral',
    description: '',
    require_deposit: false 
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services-list', user?.id],
    queryFn: async () => {
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user?.id)
        .single();

      const businessId = member?.business_id;
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ name: '', duration: '30', price: '', category: 'Geral', description: '', require_deposit: false });
  };

  const handleEditClick = (service: any) => {
    setForm({
      name: service.name,
      duration: service.duration_minutes.toString(),
      price: service.price ? service.price.toString().replace('.', ',') : '',
      category: service.category || 'Geral',
      description: service.description || '',
      require_deposit: service.require_deposit || false
    });
    setEditingId(service.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createMutation = useMutation({
    mutationFn: async (newService: ServiceForm) => {
      const { data: member } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user?.id)
        .single();
        
      if (!member?.business_id) throw new Error("Empresa não encontrada");

      const priceValue = newService.price ? parseFloat(newService.price.replace(',', '.')) : 0;
      const durationValue = parseInt(newService.duration) || 30;

      const { error } = await supabase.from('services').insert({
        name: newService.name,
        duration_minutes: durationValue,
        price: priceValue,
        category: newService.category,
        description: newService.description, 
        require_deposit: isPremium ? newService.require_deposit : false, 
        business_id: member.business_id,
        is_active: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      closeForm();
      toast.success(t('toasts.service_created'));
    },
    onError: () => toast.error(t('toasts.service_error'))
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedService: ServiceForm & { id: string }) => {
      const priceValue = updatedService.price ? parseFloat(updatedService.price.replace(',', '.')) : 0;
      const durationValue = parseInt(updatedService.duration) || 30;

      const { error } = await supabase.from('services').update({
        name: updatedService.name,
        duration_minutes: durationValue,
        price: priceValue,
        category: updatedService.category,
        description: updatedService.description, 
        require_deposit: isPremium ? updatedService.require_deposit : false 
      }).eq('id', updatedService.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      closeForm();
      toast.success(t('toasts.success_general', { defaultValue: 'Atualizado com sucesso!' }));
    },
    onError: () => toast.error(t('toasts.error_general', { defaultValue: 'Ocorreu um erro.' }))
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false }) 
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      toast.success(t('toasts.service_deleted', { defaultValue: 'Serviço arquivado.' }));
    },
    onError: () => toast.error(t('toasts.service_delete_error'))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.services.title', { defaultValue: 'Serviços' })}</h2>
          <p className="text-slate-400">{t('dashboard.services.subtitle', { defaultValue: 'Configure o que você oferece aos clientes.' })}</p>
        </div>
        <Button 
          onClick={() => { closeForm(); setIsFormOpen(true); }} 
          className="gap-2 bg-primary text-slate-900 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> {t('dashboard.services.btn_new')}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="p-6 border border-white/10 bg-slate-800 animate-in slide-in-from-top-4 relative overflow-hidden">
          {editingId && (
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl">
              Editando Serviço
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4 items-end mt-2">
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_name')}</label>
              <Input 
                placeholder="Ex: Corte de Cabelo" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                autoFocus
                required
                className="bg-white text-slate-900" 
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_category')}</label>
              <Input 
                placeholder="Ex: Cabelo" 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="bg-white text-slate-900"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_price')}</label>
              <div className="relative">
                 <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-500">
                   {currencySymbol}
                 </span>
                 <Input 
                   placeholder={pricePlaceholder}
                   value={form.price}
                   onChange={e => setForm({...form, price: e.target.value})}
                   className="pl-9 bg-white text-slate-900"
                 />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_duration')}</label>
              <div className="relative">
                 <Clock className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                 <Input 
                   type="number"
                   placeholder="30" 
                   value={form.duration}
                   onChange={e => setForm({...form, duration: e.target.value})}
                   className="pl-8 bg-white text-slate-900"
                 />
              </div>
            </div>

            <div className="md:col-span-4 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">{t('dashboard.services.label_desc', {defaultValue: 'Descrição'})}</label>
              <div className="relative">
                 <FileText className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                 <Input 
                   placeholder={t('dashboard.services.desc_placeholder', {defaultValue: 'Ex: Inclui lavagem e finalização.'})}
                   value={form.description}
                   onChange={e => setForm({...form, description: e.target.value})}
                   className="pl-8 bg-white text-slate-900"
                 />
              </div>
            </div>

            {/* --- NOVA CHAVINHA DE SINAL COM CLIQUER PARA UPGRADE --- */}
            <div 
               onClick={() => {
                 if (!isPremium) {
                   // AQUI VAI O SEU LINK DE CHECKOUT OU WHATSAPP
                   window.open('https://wa.me/55XX000000000', '_blank');
                 }
               }}
               className={`md:col-span-4 mt-4 p-4 border rounded-xl flex items-center justify-between transition-all duration-200 ${
                 isPremium 
                   ? 'border-emerald-500/20 bg-emerald-500/5' 
                   : 'border-amber-500/20 bg-slate-900/50 cursor-pointer hover:bg-slate-800 hover:border-amber-500/50 hover:shadow-lg'
               }`}
            >
               <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wallet className={`w-4 h-4 ${isPremium ? 'text-emerald-400' : 'text-amber-500'}`} /> 
                    Exigir 50% de Sinal (PIX)
                    {!isPremium && (
                      <span className="bg-amber-500 text-slate-900 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">PRO</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {isPremium 
                      ? 'O cliente precisará pagar 50% do valor via PIX para confirmar a reserva na agenda.'
                      : 'Clique aqui e faça o upgrade do seu plano para ativar a cobrança de sinal automática.'
                    }
                  </p>
               </div>
               
               {/* Usamos pointer-events-none para que o clique vaze para a div pai quando não for Premium */}
               <div className={!isPremium ? "pointer-events-none opacity-80" : ""}>
                 <Switch 
                    disabled={!isPremium}
                    checked={isPremium ? form.require_deposit : false}
                    onCheckedChange={(checked) => setForm({...form, require_deposit: checked})}
                 />
               </div>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={closeForm} className="text-slate-300 hover:text-white">
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-slate-900 font-bold">
                {editingId ? t('common.update', { defaultValue: 'Atualizar' }) : t('common.save')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {services?.length === 0 && !isFormOpen && (
          <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
             <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
             <p>{t('dashboard.services.empty_desc')}</p>
          </div>
        )}

        {services?.map((service) => (
          <Card key={service.id} className="p-4 flex items-center justify-between hover:border-primary/30 transition-all group border-white/10 bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-lg group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                {service.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {service.name}
                  {service.require_deposit && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Sinal 50%
                    </span>
                  )}
                </h3>
                {service.description && (
                   <p className="text-xs text-slate-500 mt-0.5 max-w-md truncate">{service.description}</p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration_minutes} min</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="flex items-center gap-1 font-medium text-primary">
                     {new Intl.NumberFormat(t('common.price_locale', {defaultValue: 'pt-BR'}), { style: 'currency', currency: t('common.currency', {defaultValue: 'BRL'}) }).format(service.price || 0)}
                  </span>
                  <span className="bg-slate-700 px-2 py-0.5 rounded-full uppercase text-[10px] tracking-wide text-slate-300">{service.category || 'Geral'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-500 hover:text-amber-400 hover:bg-amber-900/20 transition-all"
                onClick={() => handleEditClick(service)}
                title="Editar Serviço"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                onClick={() => {
                   if (confirm(t('toasts.confirm_delete_service', {defaultValue: 'Arquivar este serviço?'}))) deleteMutation.mutate(service.id);
                }}
                title="Excluir Serviço"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}