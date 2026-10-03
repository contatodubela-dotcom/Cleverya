-- Cleverya - Fase 1C - preflight integridade de agendamentos
-- SOMENTE LEITURA. Nao altera dados, schema, grants ou policies.

with appointment_columns as (
  select
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'appointments'
),
appointment_constraints as (
  select
    con.conname,
    con.contype,
    pg_get_constraintdef(con.oid, true) as definition
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'
    and rel.relname = 'appointments'
),
appointment_indexes as (
  select
    i.indexname,
    i.indexdef
  from pg_indexes i
  where i.schemaname = 'public'
    and i.tablename = 'appointments'
),
service_columns as (
  select
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.udt_name,
    c.is_nullable,
    c.column_default
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'services'
),
functions as (
  select
    p.proname,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as security_definer,
    p.proconfig as config,
    pg_get_functiondef(p.oid) as definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('create_public_booking','get_available_slots')
),
duplicate_exact_slots as (
  select
    professional_id,
    appointment_date,
    appointment_time,
    count(*) as qty
  from public.appointments
  where status <> 'cancelled'
  group by professional_id, appointment_date, appointment_time
  having count(*) > 1
)
select
  '01_APPOINTMENT_COLUMN' as section,
  column_name as object_name,
  jsonb_build_object(
    'ordinal_position', ordinal_position,
    'data_type', data_type,
    'udt_name', udt_name,
    'is_nullable', is_nullable,
    'default', column_default
  ) as detail
from appointment_columns

union all

select
  '02_APPOINTMENT_CONSTRAINT',
  conname,
  jsonb_build_object(
    'type', contype,
    'definition', definition
  )
from appointment_constraints

union all

select
  '03_APPOINTMENT_INDEX',
  indexname,
  jsonb_build_object('definition', indexdef)
from appointment_indexes

union all

select
  '04_SERVICE_COLUMN',
  column_name,
  jsonb_build_object(
    'ordinal_position', ordinal_position,
    'data_type', data_type,
    'udt_name', udt_name,
    'is_nullable', is_nullable,
    'default', column_default
  )
from service_columns

union all

select
  '05_FUNCTION',
  proname || '(' || args || ')',
  jsonb_build_object(
    'security_definer', security_definer,
    'config', config,
    'definition', definition
  )
from functions

union all

select
  '06_DUPLICATE_EXACT_SLOT',
  coalesce(professional_id::text, 'null') || '|' ||
  appointment_date::text || '|' ||
  appointment_time::text,
  jsonb_build_object('qty', qty)
from duplicate_exact_slots

order by section, object_name;
