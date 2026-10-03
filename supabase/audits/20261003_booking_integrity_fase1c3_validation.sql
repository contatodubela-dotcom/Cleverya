-- Cleverya - Fase 1C.3 - validacao read-only pos-protecao

with trigger_info as (
  select
    t.tgname,
    pg_get_triggerdef(t.oid, true) as definition,
    t.tgenabled
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'appointments'
    and not t.tgisinternal
),
function_info as (
  select
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
    and p.proname in (
      'has_appointment_capacity',
      'enforce_appointment_capacity',
      'get_available_slots'
    )
)
select
  '01_TRIGGER' as section,
  tgname as object_name,
  jsonb_build_object(
    'enabled', tgenabled,
    'definition', definition
  ) as detail
from trigger_info

union all

select
  '02_FUNCTION',
  proname || '(' || args || ')',
  jsonb_build_object(
    'security_definer', security_definer,
    'config', config,
    'anon_execute', anon_execute,
    'authenticated_execute', authenticated_execute,
    'service_role_execute', service_role_execute
  )
from function_info

order by section, object_name;
