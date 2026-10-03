-- Cleverya - Hardening RLS Fase 1B.3
-- Separa metricas publicas do booking das metricas autenticadas do dashboard.
-- Fecha get_usage_metrics para anon/PUBLIC e valida identidade do usuario autenticado.

begin;

-- ---------------------------------------------------------------------------
-- 1. RPC publica minima para a pagina de booking
-- ---------------------------------------------------------------------------

create or replace function public.get_public_booking_metrics(p_slug text)
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_id uuid;
  v_plan text;
  v_appointments_count integer;
  v_start_date date;
  v_end_date date;
begin
  select b.id, coalesce(b.plan_type, 'free')
    into v_business_id, v_plan
  from public.businesses b
  where lower(b.slug) = lower(p_slug)
  limit 1;

  if v_business_id is null then
    return json_build_object(
      'appointments_used', 0,
      'current_plan', 'free'
    );
  end if;

  v_start_date := date_trunc('month', now())::date;
  v_end_date := (date_trunc('month', now()) + interval '1 month')::date;

  select count(*)
    into v_appointments_count
  from public.appointments a
  where a.business_id = v_business_id
    and a.appointment_date >= v_start_date
    and a.appointment_date < v_end_date
    and a.status <> 'cancelled';

  return json_build_object(
    'appointments_used', v_appointments_count,
    'current_plan', v_plan
  );
end;
$$;

revoke all on function public.get_public_booking_metrics(text) from public;
grant execute on function public.get_public_booking_metrics(text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. get_usage_metrics vira RPC autenticada e autocontida
-- ---------------------------------------------------------------------------

create or replace function public.get_usage_metrics(target_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_id uuid;
  v_plan text;
  v_appointments_count integer;
  v_professionals_count integer;
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_role text;
begin
  v_role := auth.role();

  if v_role <> 'service_role' then
    if auth.uid() is null or target_user_id <> auth.uid() then
      raise exception 'NOT_AUTHORIZED' using errcode = '42501';
    end if;
  end if;

  select business_id
    into v_business_id
  from public.business_members
  where user_id = target_user_id
  limit 1;

  if v_business_id is null then
    select id
      into v_business_id
    from public.businesses
    where owner_id = target_user_id
    limit 1;
  end if;

  if v_business_id is null then
    return json_build_object(
      'appointments_used', 0,
      'professionals_used', 0,
      'current_plan', 'free'
    );
  end if;

  select plan_type
    into v_plan
  from public.businesses
  where id = v_business_id;

  v_start_date := date_trunc('month', now());
  v_end_date := date_trunc('month', now()) + interval '1 month';

  select count(*)
    into v_appointments_count
  from public.appointments
  where business_id = v_business_id
    and appointment_date >= v_start_date::date
    and appointment_date < v_end_date::date
    and status <> 'cancelled';

  select count(*)
    into v_professionals_count
  from public.professionals
  where business_id = v_business_id
    and is_active = true;

  return json_build_object(
    'appointments_used', v_appointments_count,
    'professionals_used', v_professionals_count,
    'current_plan', coalesce(v_plan, 'free')
  );
end;
$$;

revoke all on function public.get_usage_metrics(uuid) from public;
revoke all on function public.get_usage_metrics(uuid) from anon;
grant execute on function public.get_usage_metrics(uuid)
  to authenticated, service_role;

-- search_path defensivo tambem na trigger invoker remanescente
do $$
begin
  if to_regprocedure('public.set_default_trial_plan()') is not null then
    execute 'alter function public.set_default_trial_plan() set search_path = public, pg_temp';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
