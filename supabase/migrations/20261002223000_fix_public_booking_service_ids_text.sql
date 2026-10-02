-- Cleverya - Hardening RLS Fase 1B - correção service_ids text[]
-- Corrige comparação UUID x text[] em create_public_booking.
-- Idempotente: apenas recria a função com cast explícito.

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
     and not (p_service_id::text = any(v_professional.service_ids)) then
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

notify pgrst, 'reload schema';
