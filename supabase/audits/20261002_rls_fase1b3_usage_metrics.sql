-- Cleverya - Fase 1B.3 - validacao read-only
with f as (
  select
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as security_definer,
    p.proconfig as config,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('get_public_booking_metrics','get_usage_metrics','set_default_trial_plan')
)
select
  proname || '(' || args || ')' as function_name,
  security_definer,
  config,
  anon_execute,
  authenticated_execute,
  service_role_execute
from f
order by function_name;
