import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePlan } from '../../hooks/usePlan';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, User, Plus, Crown, Loader2, Users, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function ProfessionalsManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { plan, loading: loadingPlan } = usePlan();
  const queryClient = useQueryClient();
  
  // ESTADOS (Adicionei capacity e editingId)
  const [formData, setFormData] = useState({ name: '', capacity: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals-list', user?.id],
    queryFn: async () => {
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      let businessId = member?.business_id;
      
      // Fallback para Owner se não achar Member
      if (!businessId) {
         const { data: owner } = await supabase.from('businesses').select('id').eq('owner_id', user?.id).maybeSingle();
         businessId = owner?.id;
      }

      if (!businessId) return [];

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      let businessId = null;
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
      if (member) businessId = member.business_id;
      else {
         const { data: owner } = await supabase.from('businesses').select('id').eq('owner_id', user?.id).maybeSingle();
         businessId = owner?.id;
      }

      if (!businessId) throw new Error("Empresa não encontrada");

      // Se for CRIAÇÃO, checa limite
      if (!editingId) {
          const currentCount = professionals?.length || 0;
          if (plan === 'free' && currentCount >= 1) {
             throw new Error("Limite do plano atingido");
          }
      }

      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from('professionals')
          .update({ name: formData.name, capacity: formData.capacity })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from('professionals').insert({
          name: formData.name,
          capacity: formData.capacity,
          business_id: businessId,
          is_active: true
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      resetForm();
      toast.success(editingId ? 'Atualizado!' : t('toasts.pro_created', {defaultValue: 'Profissional adicionado!'}));
    },
    onError: (err: any) => {
      toast.error(err.message === "Limite do plano atingido" ? t('toasts.plan_limit', {defaultValue: 'Limite do plano atingido'}) : t('toasts.error_generic', {defaultValue: 'Erro ao processar'}));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals-list'] });
      toast.success(t('toasts.pro_deleted', {defaultValue: 'Profissional removido.'}));
    },
    onError: () => toast.error(t('toasts.error_generic', {defaultValue: 'Erro ao processar'}))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    upsertMutation.mutate();
  };

  const handleEdit = (pro: any) => {
    setFormData({ name: pro.name, capacity: pro.capacity || 1 });
    setEditingId(pro.id);
    setIsCreating(true); // Abre o form
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: 1 });
    setEditingId(null);
    setIsCreating(false);
  };

  const canAdd = plan !== 'free' || (professionals?.length || 0) < 1;

  if (isLoading || loadingPlan) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.team.title', { defaultValue: 'Equipe' })}</h2>
          <p className="text-slate-400">{t('dashboard.team.subtitle', { defaultValue: 'Gerencie quem atende em seu negócio.' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card de Adicionar/Editar */}
        {canAdd || editingId ? (
           isCreating ? (
             <Card className="p-4 border-primary/50 bg-slate-800/50 flex flex-col justify-center animate-in fade-in zoom-in-95 col-span-1 md:col-span-2 lg:col-span-1">
               <form onSubmit={handleSubmit} className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-primary uppercase">{editingId ? 'Editando' : 'Novo'}</span>
                    {editingId && <button type="button" onClick={resetForm}><X className="w-4 h-4 text-slate-400 hover:text-white"/></button>}
                 </div>
                 
                 {/* Nome */}
                 <Input 
                   placeholder={t('dashboard.team.name_placeholder', {defaultValue: 'Nome do Profissional'})}
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   autoFocus
                   className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                 />

                 {/* Capacidade */}
                 <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <Input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={formData.capacity}
                            onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <span className="text-xs text-slate-500">pessoas simultâneas</span>
                 </div>

                 <div className="flex gap-2 justify-end pt-2">
                   <Button type="button" size="sm" variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white">{t('common.cancel', {defaultValue: 'Cancelar'})}</Button>
                   <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="bg-primary text-slate-900 font-bold hover:bg-primary/90">
                     {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Atualizar' : t('common.save', {defaultValue: 'Salvar'}))}
                   </Button>
                 </div>
               </form>
             </Card>
           ) : (
             <button 
                onClick={() => setIsCreating(true)}
                className="group h-full min-h-[80px] rounded-xl border-2 border-dashed border-slate-700 hover:border-primary hover:bg-slate-800 flex items-center justify-center gap-2 transition-all p-4"
             >
                <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-primary flex items-center justify-center transition-colors">
                   <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                </div>
                <span className="text-sm font-medium text-slate-500 group-hover:text-primary">{t('dashboard.team.btn_new', {defaultValue: 'Adicionar Profissional'})}</span>
             </button>
           )
        ) : (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 flex flex-col items-center justify-center text-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <p className="text-sm font-bold text-amber-500">{t('dashboard.team.limit_free', {defaultValue: 'Limite do plano atingido'})}</p>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white w-full border-none" onClick={() => window.location.hash = '#pricing'}>
              {t('dashboard.banner.cta', {defaultValue: 'Ver Planos'})}
            </Button>
          </div>
        )}

        {/* Lista de Profissionais */}
        {professionals?.map((pro: any) => (
          <Card key={pro.id} className="p-4 bg-slate-800 border-slate-700 relative group hover:border-slate-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">{pro.name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                             <span className="text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Ativo
                             </span>
                             <span className="text-slate-500 flex items-center gap-1 border-l border-slate-600 pl-2">
                                <Users className="w-3 h-3" /> Cap: {pro.capacity || 1}
                             </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-2 border-t border-slate-700/50 pt-2">
                 <Button 
                    size="sm" variant="ghost" 
                    onClick={() => handleEdit(pro)}
                    className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-700"
                 >
                    <Pencil className="w-3 h-3 mr-1" /> Editar
                 </Button>
                 <Button 
                    size="sm" variant="ghost" 
                    onClick={() => {
                        if(confirm(t('toasts.confirm_delete_pro', {defaultValue: 'Remover?'}))) deleteMutation.mutate(pro.id)
                    }}
                    className="h-8 text-xs text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                 >
                    <Trash2 className="w-3 h-3 mr-1" /> Remover
                 </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}