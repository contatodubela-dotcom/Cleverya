import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Ban, Search, UserX, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ClientsManager() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const getBusinessId = async () => {
    const { data } = await supabase.from('business_members').select('business_id').eq('user_id', user?.id).single();
    return data?.business_id;
  }

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients-business', user?.id],
    queryFn: async () => {
      const businessId = await getBusinessId();
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients (id, name, phone),
          status
        `)
        .eq('business_id', businessId);

      if (error) throw error;

      const clientMap = new Map();
      data.forEach((apt: any) => {
        if (!apt.clients) return;
        const clientId = apt.clients.id;
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            ...apt.clients,
            total_appointments: 0,
            no_shows: 0,
            confirmed: 0,
          });
        }
        const client = clientMap.get(clientId);
        client.total_appointments++;
        if (apt.status === 'no_show') client.no_shows++;
        if (apt.status === 'confirmed' || apt.status === 'completed') client.confirmed++;
      });

      return Array.from(clientMap.values());
    },
    enabled: !!user?.id,
  });

  const { data: blockedClients } = useQuery({
    queryKey: ['blocked-clients', user?.id],
    queryFn: async () => {
      const businessId = await getBusinessId();
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('blocked_clients')
        .select('*, clients(*)')
        .eq('business_id', businessId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const blockMutation = useMutation({
    mutationFn: async ({ client_id, no_show_count }: { client_id: string; no_show_count: number }) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Empresa não encontrada");

      const { error } = await supabase.from('blocked_clients').upsert({
          business_id: businessId,
          client_id,
          no_show_count,
          reason: 'Múltiplos no-shows',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success(t('toasts.client_blocked'));
    },
    onError: () => toast.error(t('toasts.error_block')),
  });

  const unblockMutation = useMutation({
    mutationFn: async (client_id: string) => {
      const businessId = await getBusinessId();
      if (!businessId) throw new Error("Empresa não encontrada");

      const { error } = await supabase
        .from('blocked_clients')
        .delete()
        .eq('business_id', businessId)
        .eq('client_id', client_id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-clients'] });
      toast.success(t('toasts.client_unblocked'));
    },
    onError: () => toast.error(t('toasts.error_unblock')),
  });

  const filteredClients = clients?.filter(
    (client: any) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const isBlocked = (clientId: string) => blockedClients?.some((bc: any) => bc.client_id === clientId);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold mb-1 text-white">{t('dashboard.clients.title', {defaultValue: 'Clientes'})}</h2>
        <p className="text-slate-400">{t('dashboard.clients.subtitle', {defaultValue: 'Histórico de quem já agendou.'})}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder={t('common.search_placeholder', {defaultValue: 'Buscar nome ou telefone...'})} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 bg-slate-800 border-slate-700 text-white focus:border-primary placeholder:text-slate-500" 
        />
      </div>

      {/* Lista de Bloqueados */}
      {blockedClients && blockedClients.length > 0 && (
        <Card className="p-6 bg-red-950/20 border-red-500/20 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
            <UserX className="w-5 h-5" />
            {t('dashboard.clients.blocked_title', {defaultValue: 'Bloqueados'})} ({blockedClients.length})
          </h3>
          <div className="space-y-3">
            {blockedClients.map((bc: any) => (
              <div key={bc.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-xl border border-red-500/10">
                <div>
                  <p className="font-medium text-red-200">{bc.clients?.name}</p>
                  <p className="text-xs text-red-400/70">
                    {bc.no_show_count} faltas • Bloqueado em {new Date(bc.blocked_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => unblockMutation.mutate(bc.client_id)} className="border-red-500/30 text-red-400 hover:bg-red-950">
                  {t('dashboard.clients.btn_unblock', {defaultValue: 'Desbloquear'})}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* NOVO LAYOUT: Lista Geral Vertical (Estilo Equipe) */}
      <div className="grid gap-3">
        {filteredClients?.length === 0 ? (
           <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
              <p>Nenhum cliente encontrado.</p>
           </div>
        ) : (
          filteredClients?.map((client: any) => {
            const blocked = isBlocked(client.id);
            return (
              <Card 
                key={client.id} 
                className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 transition-all group border-white/10 bg-slate-800/50 ${blocked ? 'opacity-50 border-red-500/30' : ''}`}
              >
                
                {/* Lado Esquerdo: Ícone, Nome e Telefone */}
                <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                   <div className="w-12 h-12 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-slate-600 transition-colors">
                      <User className="w-6 h-6" />
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                       <h3 className="font-bold text-white text-base">{client.name}</h3>
                       {blocked && <Ban className="w-4 h-4 text-red-500" />}
                     </div>
                     <p className="text-sm text-slate-400">{client.phone}</p>
                   </div>
                </div>

                {/* Meio/Direita: Estatísticas e Botões */}
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-t-0">
                    
                    {/* Bloco de Estatísticas */}
                    <div className="flex items-center gap-4 bg-slate-900/50 p-2 px-4 rounded-xl border border-white/5 flex-1 md:flex-auto justify-center shadow-inner">
                       <div className="text-center">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{t('dashboard.clients.stats_total')}</p>
                          <p className="font-bold text-white leading-none">{client.total_appointments}</p>
                       </div>
                       <div className="w-px h-6 bg-slate-700" />
                       <div className="text-center">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{t('dashboard.clients.stats_ok')}</p>
                          <p className="font-bold text-green-400 leading-none">{client.confirmed}</p>
                       </div>
                       <div className="w-px h-6 bg-slate-700" />
                       <div className="text-center">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{t('dashboard.clients.stats_faults')}</p>
                          <p className="font-bold text-red-400 leading-none">{client.no_shows}</p>
                       </div>
                    </div>

                    {/* Botão de Bloqueio Automático */}
                    {!blocked && client.no_shows >= 2 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full md:w-auto text-red-400 border-red-900/50 hover:bg-red-950/30 hover:text-red-300 shrink-0" 
                        onClick={() => blockMutation.mutate({ client_id: client.id, no_show_count: client.no_shows })}
                      >
                        <Ban className="w-4 h-4 mr-2" /> {t('dashboard.clients.btn_block', {defaultValue: 'Bloquear'})}
                      </Button>
                    )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}