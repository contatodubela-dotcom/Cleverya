import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO, isPast } from 'date-fns';

export function usePlan() {
  const { user } = useAuth();

  // 1. Busca Métricas de Uso (Contagem)
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['usage-metrics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc('get_usage_metrics', { target_user_id: user.id });
      if (error) return null;
      return data as { appointments_used: number, professionals_used: number };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5 
  });

  // 2. Busca Status do Plano e Trial (Dados Reais)
  const { data: planData, isLoading: loadingPlan } = useQuery({
    queryKey: ['plan-status', user?.id],
    queryFn: async () => {
        if (!user?.id) return null;
        // Busca direto da tabela business para ter a data exata
        const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).maybeSingle();
        const businessId = member?.business_id;
        
        // Fallback se for owner direto
        let query = supabase.from('businesses').select('plan_type, subscription_status, trial_ends_at');
        if (businessId) query = query.eq('id', businessId);
        else query = query.eq('owner_id', user.id);

        const { data } = await query.maybeSingle();
        return data;
    },
    enabled: !!user?.id
  });

  // --- LÓGICA DE TRIAL ---
  const dbPlan = planData?.plan_type || 'free';
  const subStatus = planData?.subscription_status;
  const trialEnds = planData?.trial_ends_at ? parseISO(planData.trial_ends_at) : null;

  let finalPlan = dbPlan;
  let daysLeft = 0;
  let isTrial = false;

  if (subStatus === 'trial' && trialEnds) {
      if (isPast(trialEnds)) {
          // SE O TRIAL ACABOU: Força ser Free
          finalPlan = 'free';
      } else {
          // SE AINDA ESTÁ VALENDO
          finalPlan = 'pro'; // Garante que é PRO
          isTrial = true;
          daysLeft = differenceInDays(trialEnds, new Date());
      }
  }

  // --- LIMITES ---
  const limits = {
    maxAppointments: finalPlan === 'business' || finalPlan === 'pro' ? 999999 : 50,
    maxProfessionals: finalPlan === 'business' ? 999999 : (finalPlan === 'pro' ? 3 : 1),
    hasReports: finalPlan !== 'free',
    hasCustomLink: finalPlan !== 'free',
  };

  const usage = {
    appointments: metrics?.appointments_used || 0,
    professionals: metrics?.professionals_used || 0,
  };

  const checkLimit = (feature: 'appointments' | 'professionals') => {
    if (feature === 'appointments') return usage.appointments < limits.maxAppointments;
    if (feature === 'professionals') return usage.professionals < limits.maxProfessionals;
    return true;
  };

  return {
    plan: finalPlan,
    isTrial,
    daysLeft,
    usage,
    limits,
    checkLimit,
    loading: loadingMetrics || loadingPlan
  };
}