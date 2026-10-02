-- Cleverya - Hardening RLS Fase 1B - Inventário read-only
-- Objetivo: produzir um snapshot auditável antes de qualquer alteração de RLS.
-- Não altera schema, dados, grants ou policies.

with target_tables(table_name) as (
  values
    ('appointments'),
    ('clients'),
    ('businesses'),
    ('business_members'),
    ('blocked_clients'),
    ('services'),
    ('professionals'),
    ('availability_settings')
),
tables_snapshot as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target_tables t on t.table_name = c.relname
  where n.nspname = 'public'
    and c.relkind in ('r','p')
),
policies_snapshot as (
  select
    p.tablename as table_name,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
  from pg_policies p
  join target_tables t on t.table_name = p.tablename
  where p.schemaname = 'public'
),
grants_snapshot as (
  select
    g.table_name,
    g.grantee,
    g.privilege_type,
    g.is_grantable
  from information_schema.role_table_grants g
  join target_tables t on t.table_name = g.table_name
  where g.table_schema = 'public'
    and g.grantee in ('anon','authenticated','public')
),
columns_snapshot as (
  select
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.is_nullable
  from information_schema.columns c
  join target_tables t on t.table_name = c.table_name
  where c.table_schema = 'public'
),
functions_snapshot as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_arguments,
    p.prosecdef as security_definer,
    coalesce(array_agg(distinct r.rolname) filter (where r.rolname is not null), '{}') as executable_by
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  left join pg_roles r
    on has_function_privilege(r.oid, p.oid, 'EXECUTE')
   and r.rolname in ('anon','authenticated','public')
  where n.nspname = 'public'
  group by n.nspname, p.proname, p.oid, p.prosecdef
)
select jsonb_pretty(
  jsonb_build_object(
    'generated_at', now(),
    'tables', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_name) from tables_snapshot x), '[]'::jsonb),
    'policies', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_name, x.policyname) from policies_snapshot x), '[]'::jsonb),
    'grants', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_name, x.grantee, x.privilege_type) from grants_snapshot x), '[]'::jsonb),
    'columns', coalesce((select jsonb_agg(to_jsonb(x) order by x.table_name, x.ordinal_position) from columns_snapshot x), '[]'::jsonb),
    'functions', coalesce((select jsonb_agg(to_jsonb(x) order by x.function_name, x.identity_arguments) from functions_snapshot x), '[]'::jsonb)
  )
) as rls_fase1b_inventory;
