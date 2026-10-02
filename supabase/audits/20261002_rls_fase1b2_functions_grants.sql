-- Cleverya - Fase 1B.2/1B.3 - auditoria read-only
-- Executar apos a migration 20261002233000.

with functions as (
  select
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) as identity_arguments,
    p.prosecdef as security_definer,
    p.proconfig as config,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
    pg_get_functiondef(p.oid) as definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'get_available_slots',
      'get_usage_metrics',
      'get_public_business',
      'create_public_booking',
      'is_business_member',
      'handle_new_business',
      'handle_new_user',
      'handle_new_user_signup',
      'set_default_trial_plan'
    )
),
table_grants as (
  select
    table_name,
    grantee,
    privilege_type
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'appointments',
      'clients',
      'businesses',
      'business_members',
      'blocked_clients',
      'services',
      'professionals',
      'availability_settings'
    )
    and grantee in ('anon', 'authenticated')
)
select
  '01_FUNCTION' as section,
  proname || '(' || identity_arguments || ')' as object_name,
  jsonb_build_object(
    'security_definer', security_definer,
    'config', config,
    'anon_execute', anon_execute,
    'authenticated_execute', authenticated_execute,
    'service_role_execute', service_role_execute,
    'definition', case
      when proname = 'get_usage_metrics' then definition
      else null
    end
  ) as detail
from functions

union all

select
  '02_TABLE_GRANT',
  table_name,
  jsonb_build_object(
    'grantee', grantee,
    'privilege', privilege_type
  )
from table_grants

order by section, object_name;
