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

// Interface para tipagem
interface Professional {
  id: string;
  name: string;
  capacity: number;
  is_active: boolean;
}

export default function ProfessionalsManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { plan, loading: loadingPlan } = usePlan();
  const queryClient = useQueryClient();
  
  // Estados para Formulário e Edição
  const [formData, setFormData] = useState({ name: '', capacity: 1 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Busca Profissionais
  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals-list', user?.id],
    queryFn: async () => {
      // Tenta buscar ID via business_members
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).maybeSingle();
      let businessId = member?.business_id;
      
      // Se não achar, tenta buscar como dono (Fallback)
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
      return data as Professional[];
    },
    enabled: !!user?.id,
  });

  // Mutação (Criar ou Editar)
  const upsertMutation = useMutation({
    mutationFn: async () => {
      let businessId = null;
      const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).maybeSingle();
      if (member) businessId = member.business_id;
      else {
         const { data: owner } = await supabase.from('businesses').select('id').eq('owner_id', user?.id).maybeSingle();
         businessId = owner?.id;
      }

      if (!businessId) throw new Error("Empresa não encontrada");

      // Checa limite apenas se for criação nova
      if (!editingId) {
          const currentCount = professionals?.length || 0;
          if (plan === 'free' && currentCount >= 1) {
             throw new Error("Limite do plano atingido");
          }
      }

      if (editingId) {
        // ATUALIZAR
        const { error } = await supabase
          .from('professionals')
          .update({ name: formData.name, capacity: formData.capacity })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // CRIAR
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
      toast.success(editingId ? 'Atualizado com sucesso!' : t('toasts.pro_created', {defaultValue: 'Profissional adicionado!'}));
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

  const handleEdit = (pro: Professional) => {
    setFormData({ name: pro.name, capacity: pro.capacity || 1 });
    setEditingId(pro.id);
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: 1 });
    setEditingId(null);
    setIsCreating(false);
  };

  const canAdd = plan !== 'free' || (professionals?.length || 0) < 1;

  if (isLoading || loadingPlan) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('dashboard.team.title', { defaultValue: 'Equipe' })}</h2>
          <p className="text-slate-400">{t('dashboard.team.subtitle', { defaultValue: 'Gerencie quem atende em seu negócio.' })}</p>
        </div>
         <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
           {professionals?.length || 0} / {plan === 'free' ? '1' : '∞'} Ativos
        </div>
      </div>

      <div className="space-y-4"> {/* MUDANÇA: Grid removido, agora é space-y-4 (lista vertical) */}
        
        {/* Formulário de Adicionar/Editar */}
        {isCreating && (
             <Card className="p-6 border-primary/50 bg-slate-800 animate-in slide-in-from-top-4">
               <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-primary uppercase">{editingId ? 'Editando Profissional' : 'Novo Profissional'}</span>
                    <button type="button" onClick={resetForm}><X className="w-4 h-4 text-slate-400 hover:text-white"/></button>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
                        <Input 
                        placeholder={t('dashboard.team.name_placeholder', {defaultValue: 'Nome do Profissional'})}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        autoFocus
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Capacidade Simultânea</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <Input 
                                type="number" 
                                min="1" 
                                max="50"
                                value={formData.capacity}
                                onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                                className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary"
                            />
                        </div>
                    </div>
                 </div>

                 <div className="flex gap-2 justify-end pt-2">
                   <Button type="button" size="sm" variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white hover:bg-slate-800">{t('common.cancel', {defaultValue: 'Cancelar'})}</Button>
                   <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="bg-primary text-slate-900 font-bold hover:bg-primary/90">
                     {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Salvar Alterações' : t('common.save', {defaultValue: 'Salvar'}))}
                   </Button>
                 </div>
               </form>
             </Card>
        )}

        {/* Botão de Novo Profissional (Modo Lista) */}
        {!isCreating && (
            canAdd ? (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full rounded-xl border border-dashed border-slate-700 hover:border-primary hover:bg-slate-800/50 flex items-center justify-center gap-2 transition-all p-4 group"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-primary flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white">{t('dashboard.team.btn_new', {defaultValue: 'Adicionar Profissional'})}</span>
                </button>
            ) : (
                <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-bold text-amber-500">{t('dashboard.team.limit_free', {defaultValue: 'Limite do plano atingido'})}</p>
                    </div>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none h-8" onClick={() => window.location.hash = '#pricing'}>
                        {t('dashboard.banner.cta', {defaultValue: 'Ver Planos'})}
                    </Button>
                </div>
            )
        )}

        {/* Lista de Profissionais (Visual padronizado com Serviços) */}
        <div className="grid gap-3">
            {professionals?.map((pro) => (
            <Card key={pro.id} className="p-4 flex items-center justify-between hover:border-primary/30 transition-all group border-white/10 bg-slate-800/50">
                
                {/* Lado Esquerdo: Ícone e Info */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-slate-600 transition-colors">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">{pro.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span> 
                                Ativo
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="flex items-center gap-1" title="Capacidade simultânea">
                                <Users className="w-3 h-3" /> Cap: {pro.capacity || 1}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Lado Direito: Ações */}
                <div className="flex gap-1">
                    <Button 
                        size="icon" variant="ghost" 
                        onClick={() => handleEdit(pro)}
                        className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                        size="icon" variant="ghost" 
                        onClick={() => {
                            if(confirm(t('toasts.confirm_delete_pro', {defaultValue: 'Remover este profissional?'}))) deleteMutation.mutate(pro.id)
                        }}
                        className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg"
                        title="Remover"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
            ))}
        </div>
      </div>
    </div>
  );
}