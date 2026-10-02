-- Cleverya - Hardening RLS Fase 1B
-- Fecha exposicoes diretas de PII e dados de agendamento sem quebrar o fluxo publico.
-- O fluxo publico passa por RPCs SECURITY DEFINER com retorno minimo e validacao server-side.

begin;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.is_business_member(uuid) from anon;
grant execute on function public.is_business_member(uuid) to authenticated;

-- Perfil publico: expoe somente os campos necessarios para a pagina de agendamento.
create or replace function public.get_public_business(
  p_slug text default null,
  p_owner_id uuid default null
)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  banner_url text,
  slug text,
  plan_type text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    b.id,
    b.owner_id,
    b.name,
    b.banner_url,
    b.slug,
    b.plan_type
  from public.businesses b
  where
    (p_slug is not null and lower(b.slug) = lower(p_slug))
    or
    (p_owner_id is not null and b.owner_id = p_owner_id)
  order by
    case when p_slug is not null and lower(b.slug) = lower(p_slug) then 0 else 1 end
  limit 1;
$$;

revoke all on function public.get_public_business(text, uuid) from public;
grant execute on function public.get_public_business(text, uuid) to anon, authenticated;

-- Criacao publica de agendamento:
-- - nao expoe clients/blocked_clients/appointments para leitura publica;
-- - valida relacoes business/service/professional;
-- - cria/atualiza cliente somente dentro da empresa;
-- - bloqueia clientes marcados;
-- - retorna apenas id/status do agendamento.
create or replace function public.create_public_booking(
  p_business_id uuid,
  p_service_id uuid,
  p_professional_id uuid,
  p_appointment_date date,
  p_appointment_time time,
  p_client_name text,
  p_client_phone text,
  p_client_email text default null
)
returns table (
  appointment_id uuid,
  appointment_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_service public.services%rowtype;
  v_professional public.professionals%rowtype;
  v_client_id uuid;
  v_status text;
  v_phone text;
  v_name text;
  v_email text;
begin
  v_phone := btrim(coalesce(p_client_phone, ''));
  v_name := btrim(coalesce(p_client_name, ''));
  v_email := nullif(btrim(coalesce(p_client_email, '')), '');

  if v_name = '' then
    raise exception 'CLIENT_NAME_REQUIRED' using errcode = '22023';
  end if;

  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 10 then
    raise exception 'CLIENT_PHONE_INVALID' using errcode = '22023';
  end if;

  select *
    into v_service
  from public.services s
  where s.id = p_service_id
    and s.business_id = p_business_id
    and s.is_active = true;

  if not found then
    raise exception 'SERVICE_INVALID' using errcode = '22023';
  end if;

  select *
    into v_professional
  from public.professionals p
  where p.id = p_professional_id
    and p.business_id = p_business_id
    and p.is_active = true;

  if not found then
    raise exception 'PROFESSIONAL_INVALID' using errcode = '22023';
  end if;

  if v_professional.service_ids is not null
     and cardinality(v_professional.service_ids) > 0
     and not (p_service_id = any(v_professional.service_ids)) then
    raise exception 'PROFESSIONAL_SERVICE_INVALID' using errcode = '22023';
  end if;

  select c.id
    into v_client_id
  from public.clients c
  where c.business_id = p_business_id
    and c.phone = v_phone
  order by c.created_at asc
  limit 1;

  if v_client_id is null then
    insert into public.clients (business_id, name, phone, email)
    values (p_business_id, v_name, v_phone, v_email)
    returning id into v_client_id;
  else
    update public.clients
       set name = v_name,
           email = v_email
     where id = v_client_id
       and business_id = p_business_id;
  end if;

  if exists (
    select 1
    from public.blocked_clients bc
    where bc.business_id = p_business_id
      and bc.client_id = v_client_id
  ) then
    raise exception 'CLIENT_BLOCKED' using errcode = 'P0001';
  end if;

  v_status := case when coalesce(v_service.require_deposit, false)
    then 'pending_payment'
    else 'pending'
  end;

  insert into public.appointments (
    business_id,
    client_id,
    service_id,
    professional_id,
    appointment_date,
    appointment_time,
    status
  )
  values (
    p_business_id,
    v_client_id,
    p_service_id,
    p_professional_id,
    p_appointment_date,
    p_appointment_time,
    v_status
  )
  returning id, status
  into appointment_id, appointment_status;

  return next;
end;
$$;

revoke all on function public.create_public_booking(uuid, uuid, uuid, date, time, text, text, text) from public;
grant execute on function public.create_public_booking(uuid, uuid, uuid, date, time, text, text, text) to anon, authenticated;

-- O RPC publico de slots precisa conseguir ler os agendamentos mesmo depois de
-- fecharmos SELECT direto em appointments.
do $$
begin
  if to_regprocedure('public.get_available_slots(uuid,date,integer)') is not null then
    execute 'alter function public.get_available_slots(uuid,date,integer) security definer';
    execute 'alter function public.get_available_slots(uuid,date,integer) set search_path = public, pg_temp';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- RLS: remove policies duplicadas/permissivas e recria conjunto minimo
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'appointments',
        'availability_settings',
        'blocked_clients',
        'business_members',
        'businesses',
        'clients',
        'professionals',
        'services'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  end loop;
end
$$;

-- businesses
create policy businesses_owner_insert
on public.businesses
for insert
to authenticated
with check (owner_id = auth.uid());

create policy businesses_owner_or_member_select
on public.businesses
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_business_member(id)
);

create policy businesses_owner_update
on public.businesses
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy businesses_owner_delete
on public.businesses
for delete
to authenticated
using (owner_id = auth.uid());

-- business_members
create policy business_members_read_own
on public.business_members
for select
to authenticated
using (user_id = auth.uid());

create policy business_members_owner_insert
on public.business_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
  )
);

-- clients
create policy clients_members_all
on public.clients
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- blocked_clients
create policy blocked_clients_members_all
on public.blocked_clients
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- appointments
create policy appointments_members_all
on public.appointments
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- services
create policy services_public_read_active
on public.services
for select
to anon, authenticated
using (is_active = true);

create policy services_members_all
on public.services
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- professionals
create policy professionals_public_read_active
on public.professionals
for select
to anon, authenticated
using (is_active = true);

create policy professionals_members_all
on public.professionals
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

-- availability_settings
create policy availability_public_read_active
on public.availability_settings
for select
to anon, authenticated
using (is_active = true);

create policy availability_members_all
on public.availability_settings
for all
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

commit;

-- Validacoes sugeridas apos aplicar:
-- 1) anon nao consegue SELECT direto em businesses/clients/blocked_clients/appointments.
-- 2) anon consegue executar get_public_business e create_public_booking.
-- 3) dashboard autenticado continua limitado a business_id do proprio membro.
