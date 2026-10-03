-- Cleverya - WA1A.1 - validacao READ ONLY

select
  '01_COLUMN' as section,
  c.column_name as object_name,
  jsonb_build_object(
    'data_type', c.data_type,
    'nullable', c.is_nullable,
    'default', c.column_default
  ) as detail
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'whatsapp_automation_settings'
  and c.column_name = 'default_country_calling_code'

union all

select
  '02_CONSTRAINT',
  con.conname,
  jsonb_build_object(
    'validated', con.convalidated,
    'definition', pg_get_constraintdef(con.oid)
  )
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = 'whatsapp_automation_settings'
  and con.conname = 'whatsapp_automation_settings_country_calling_code_check'

union all

select
  '03_SETTINGS',
  s.business_id::text,
  jsonb_build_object(
    'enabled', s.enabled,
    'default_language', s.default_language,
    'default_country_calling_code', s.default_country_calling_code
  )
from public.whatsapp_automation_settings s

order by section, object_name;
