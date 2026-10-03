-- Cleverya - WA1A - validacao READ ONLY da fundacao
-- Executar somente DEPOIS de eventual aplicacao autorizada da migration WA1A.

with expected_tables(name) as (
  values
    ('whatsapp_connections'),
    ('whatsapp_credentials'),
    ('whatsapp_automation_settings'),
    ('whatsapp_outbox'),
    ('whatsapp_delivery_events')
)
select
  '01_TABLE' as section,
  e.name as object_name,
  jsonb_build_object(
    'exists', to_regclass('public.' || e.name) is not null,
    'rls_enabled', coalesce(c.relrowsecurity, false)
  ) as detail
from expected_tables e
left join pg_class c
  on c.oid = to_regclass('public.' || e.name)

union all

select
  '02_CREDENTIAL_GRANT',
  'whatsapp_credentials',
  jsonb_build_object(
    'anon_select', has_table_privilege('anon','public.whatsapp_credentials','select'),
    'authenticated_select', has_table_privilege('authenticated','public.whatsapp_credentials','select'),
    'service_role_select', has_table_privilege('service_role','public.whatsapp_credentials','select')
  )

union all

select
  '03_DELIVERY_GRANT',
  'whatsapp_delivery_events',
  jsonb_build_object(
    'anon_select', has_table_privilege('anon','public.whatsapp_delivery_events','select'),
    'authenticated_select', has_table_privilege('authenticated','public.whatsapp_delivery_events','select'),
    'service_role_select', has_table_privilege('service_role','public.whatsapp_delivery_events','select')
  )

union all

select
  '04_CLAIM_FUNCTION',
  p.proname,
  jsonb_build_object(
    'security_definer', p.prosecdef,
    'anon_execute', has_function_privilege('anon',p.oid,'execute'),
    'authenticated_execute', has_function_privilege('authenticated',p.oid,'execute'),
    'service_role_execute', has_function_privilege('service_role',p.oid,'execute')
  )
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname='claim_whatsapp_outbox'

union all

select
  '05_OUTBOX_DEDUPE',
  i.indexname,
  jsonb_build_object('definition', i.indexdef)
from pg_indexes i
where i.schemaname = 'public'
  and i.tablename = 'whatsapp_outbox'
  and i.indexdef ilike '%dedupe_key%'

order by section, object_name;
