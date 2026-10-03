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
  '03_OUTBOX_DEDUPE',
  i.indexname,
  jsonb_build_object('definition', i.indexdef)
from pg_indexes i
where i.schemaname = 'public'
  and i.tablename = 'whatsapp_outbox'
  and i.indexdef ilike '%dedupe_key%'

order by section, object_name;
