-- Cleverya - Hardening RLS Fase 1B.2
-- Reduz grants excessivos de tabelas e RPCs sem alterar o fluxo publico homologado.
-- Mantem get_usage_metrics temporariamente ate a substituicao controlada.

begin;

-- ---------------------------------------------------------------------------
-- 1. Tabelas publicas: anon recebe somente o minimo necessario.
-- O booking publico usa RPCs SECURITY DEFINER para businesses/clients/
-- blocked_clients/appointments.
-- ---------------------------------------------------------------------------

revoke all privileges on table public.appointments from anon;
revoke all privileges on table public.clients from anon;
revoke all privileges on table public.businesses from anon;
revoke all privileges on table public.business_members from anon;
revoke all privileges on table public.blocked_clients from anon;

revoke all privileges on table public.services from anon;
revoke all privileges on table public.professionals from anon;
revoke all privileges on table public.availability_settings from anon;

grant select on table public.services to anon;
grant select on table public.professionals to anon;
grant select on table public.availability_settings to anon;

-- authenticated precisa de DML normal, mas nao de privilegios estruturais.
revoke truncate, references, trigger on table public.appointments from authenticated;
revoke truncate, references, trigger on table public.clients from authenticated;
revoke truncate, references, trigger on table public.businesses from authenticated;
revoke truncate, references, trigger on table public.business_members from authenticated;
revoke truncate, references, trigger on table public.blocked_clients from authenticated;
revoke truncate, references, trigger on table public.services from authenticated;
revoke truncate, references, trigger on table public.professionals from authenticated;
revoke truncate, references, trigger on table public.availability_settings from authenticated;

-- ---------------------------------------------------------------------------
-- 2. RPCs publicas intencionais
-- ---------------------------------------------------------------------------

-- Overload usado pelo BookingPage.
revoke all on function public.get_available_slots(uuid, date, integer) from public;
grant execute on function public.get_available_slots(uuid, date, integer)
  to anon, authenticated, service_role;

-- Overload legado: nao usado pelo frontend atual.
do $$
begin
  if to_regprocedure('public.get_available_slots(uuid,text,integer)') is not null then
    execute 'revoke all on function public.get_available_slots(uuid,text,integer) from public';
    execute 'revoke all on function public.get_available_slots(uuid,text,integer) from anon';
    execute 'revoke all on function public.get_available_slots(uuid,text,integer) from authenticated';
    execute 'grant execute on function public.get_available_slots(uuid,text,integer) to service_role';
  end if;
end
$$;

-- RPCs novas da Fase 1B: explicita superficie publica minima.
revoke all on function public.get_public_business(text, uuid) from public;
grant execute on function public.get_public_business(text, uuid)
  to anon, authenticated, service_role;

revoke all on function public.create_public_booking(
  uuid, uuid, uuid, date, time, text, text, text
) from public;
grant execute on function public.create_public_booking(
  uuid, uuid, uuid, date, time, text, text, text
) to anon, authenticated, service_role;

-- Helper interno de RLS: nunca deve ser RPC anon/public.
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_member(uuid) from anon;
grant execute on function public.is_business_member(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Trigger functions nao devem estar expostas via /rpc.
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.handle_new_business()',
    'public.handle_new_user()',
    'public.handle_new_user_signup()',
    'public.set_default_trial_plan()'
  ]
  loop
    if to_regprocedure(fn) is not null then
      execute format('revoke all on function %s from public', fn);
      execute format('revoke all on function %s from anon', fn);
      execute format('revoke all on function %s from authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER: fixa search_path contra object-shadowing.
-- Nao altera a logica das funcoes.
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.get_usage_metrics(uuid)') is not null then
    execute 'alter function public.get_usage_metrics(uuid) set search_path = public, pg_temp';
  end if;

  if to_regprocedure('public.handle_new_business()') is not null then
    execute 'alter function public.handle_new_business() set search_path = public, pg_temp';
  end if;

  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'alter function public.handle_new_user() set search_path = public, pg_temp';
  end if;

  if to_regprocedure('public.handle_new_user_signup()') is not null then
    execute 'alter function public.handle_new_user_signup() set search_path = public, pg_temp';
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;

-- get_usage_metrics(uuid) permanece temporariamente executavel pelo fluxo atual.
-- A Fase 1B.3 substituira essa RPC por uma superficie publica mais restrita.
