-- Cleverya - Fase 1C.4A - amplia status de appointments para ciclo de pagamento
-- Preserva integralmente a regra atual de appointments_status_check e adiciona:
--   payment_expired
--   payment_conflict

begin;

do $$
declare
  v_expr text;
begin
  select pg_get_expr(c.conbin, c.conrelid)
    into v_expr
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'appointments'
    and c.conname = 'appointments_status_check'
    and c.contype = 'c';

  if v_expr is null then
    raise exception 'appointments_status_check nao encontrada';
  end if;

  execute 'alter table public.appointments drop constraint appointments_status_check';

  execute format(
    'alter table public.appointments add constraint appointments_status_check check ((%s) or status in (''payment_expired'', ''payment_conflict'')) not valid',
    v_expr
  );

  execute 'alter table public.appointments validate constraint appointments_status_check';
end
$$;

notify pgrst, 'reload schema';

commit;
