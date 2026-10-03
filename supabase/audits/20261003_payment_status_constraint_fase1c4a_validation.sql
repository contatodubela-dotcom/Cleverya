-- Cleverya - Fase 1C.4A - validacao read-only da constraint de status

select
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid, true) as definition,
  c.convalidated as validated
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'appointments'
  and c.conname = 'appointments_status_check';
