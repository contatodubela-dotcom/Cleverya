-- Cleverya - WA1A - preflight READ ONLY
-- Nao altera dados, schema, policies, grants ou functions.

select
  '01_REQUIRED_HELPERS' as section,
  p.proname as object_name,
  jsonb_build_object(
    'arguments', pg_get_function_identity_arguments(p.oid),
    'security_definer', p.prosecdef,
    'config', p.proconfig
  ) as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_business_member')

union all

select
  '02_EXISTING_WHATSAPP_TABLE',
  t.table_name,
  jsonb_build_object('exists', true)
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_name like 'whatsapp_%'

union all

select
  '03_EXISTING_REMINDER_FUNCTION',
  p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
  jsonb_build_object(
    'security_definer', p.prosecdef,
    'anon_execute', has_function_privilege('anon', p.oid, 'execute'),
    'authenticated_execute', has_function_privilege('authenticated', p.oid, 'execute'),
    'service_role_execute', has_function_privilege('service_role', p.oid, 'execute')
  )
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    p.proname ilike '%reminder%'
    or p.proname ilike '%whatsapp%'
  )

union all

select
  '04_APPOINTMENT_STATUS',
  a.status,
  jsonb_build_object('qty', count(*))
from public.appointments a
group by a.status

order by section, object_name;
