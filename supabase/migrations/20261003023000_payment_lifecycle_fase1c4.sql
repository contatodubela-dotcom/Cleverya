-- Cleverya - Fase 1C.4 - ciclo de vida de pagamento e liberacao automatica de vaga
-- Reserva de pagamento: 30 minutos.
-- Mantem trilha de auditoria: reservas expiradas viram payment_expired, nao sao apagadas.

begin;

alter table public.appointments
  add column if not exists payment_expires_at timestamptz,
  add column if not exists payment_checkout_url text,
  add column if not exists payment_creation_token uuid,
  add column if not exists payment_creation_started_at timestamptz;

comment on column public.appointments.payment_expires_at is
  'Prazo final da reserva de vaga aguardando pagamento.';
comment on column public.appointments.payment_checkout_url is
  'Checkout URL da preferencia ativa do Mercado Pago, para reuso idempotente.';
comment on column public.appointments.payment_creation_token is
  'Token efemero para serializar criacao de preferencia de pagamento.';
comment on column public.appointments.payment_creation_started_at is
  'Inicio da tentativa de criacao da preferencia de pagamento.';

create index if not exists appointments_pending_payment_expiry_idx
  on public.appointments (payment_expires_at)
  where status = 'pending_payment' and mp_payment_id is null;

-- Backfill conservador:
-- apenas reservas sem preferencia externa recebem prazo retroativo.
-- Preferencias legadas existentes permanecem sem prazo automatico para evitar
-- liberar vaga enquanto um checkout antigo ainda puder ser pago.
update public.appointments
set payment_expires_at = created_at + interval '30 minutes'
where status = 'pending_payment'
  and mp_payment_id is null
  and mp_preference_id is null
  and payment_expires_at is null;

create or replace function public.expire_stale_pending_payments()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.appointments
  set
    status = 'payment_expired',
    payment_creation_token = null,
    payment_creation_started_at = null
  where status = 'pending_payment'
    and mp_payment_id is null
    and payment_expires_at is not null
    and payment_expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_pending_payments() from public;
revoke all on function public.expire_stale_pending_payments() from anon;
revoke all on function public.expire_stale_pending_payments() from authenticated;
grant execute on function public.expire_stale_pending_payments() to service_role;

create or replace function public.has_appointment_capacity(
  p_professional_id uuid,
  p_date date,
  p_start_time time,
  p_duration_minutes integer,
  p_exclude_appointment_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_capacity integer;
  v_new_start timestamp;
  v_new_end timestamp;
  v_max_occupancy integer;
begin
  if p_professional_id is null
     or p_date is null
     or p_start_time is null
     or p_duration_minutes is null
     or p_duration_minutes <= 0 then
    return false;
  end if;

  select greatest(coalesce(p.capacity, 1), 1)
    into v_capacity
  from public.professionals p
  where p.id = p_professional_id
    and p.is_active = true;

  if v_capacity is null then
    return false;
  end if;

  v_new_start := p_date::timestamp + p_start_time;
  v_new_end := v_new_start + make_interval(mins => p_duration_minutes);

  with existing as (
    select
      a.id,
      (a.appointment_date::timestamp + a.appointment_time) as starts_at,
      (a.appointment_date::timestamp + a.appointment_time
        + make_interval(mins => s.duration_minutes)) as ends_at
    from public.appointments a
    join public.services s on s.id = a.service_id
    where a.professional_id = p_professional_id
      and a.appointment_date = p_date
      and (
        a.status in ('pending', 'confirmed')
        or (
          a.status = 'pending_payment'
          and (
            a.payment_expires_at is null
            or a.payment_expires_at > now()
          )
        )
      )
      and (p_exclude_appointment_id is null or a.id <> p_exclude_appointment_id)
      and (a.appointment_date::timestamp + a.appointment_time) < v_new_end
      and (a.appointment_date::timestamp + a.appointment_time
           + make_interval(mins => s.duration_minutes)) > v_new_start
  ),
  candidate_points as (
    select v_new_start as point
    union
    select e.starts_at
    from existing e
    where e.starts_at >= v_new_start
      and e.starts_at < v_new_end
  ),
  occupancy as (
    select
      cp.point,
      count(e.id) as qty
    from candidate_points cp
    left join existing e
      on e.starts_at <= cp.point
     and e.ends_at > cp.point
    group by cp.point
  )
  select coalesce(max(qty), 0)::integer
    into v_max_occupancy
  from occupancy;

  return v_max_occupancy < v_capacity;
end;
$$;

revoke all on function public.has_appointment_capacity(uuid,date,time,integer,uuid) from public;
revoke all on function public.has_appointment_capacity(uuid,date,time,integer,uuid) from anon;
revoke all on function public.has_appointment_capacity(uuid,date,time,integer,uuid) from authenticated;
grant execute on function public.has_appointment_capacity(uuid,date,time,integer,uuid) to service_role;

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
  perform public.expire_stale_pending_payments();

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
    status,
    payment_expires_at
  )
  values (
    p_business_id,
    v_client_id,
    p_service_id,
    p_professional_id,
    p_appointment_date,
    p_appointment_time,
    v_status,
    case
      when coalesce(v_service.require_deposit, false)
        then now() + interval '30 minutes'
      else null
    end
  )
  returning id, status
  into appointment_id, appointment_status;

  return next;
end;
$$;

revoke all on function public.create_public_booking(uuid,uuid,uuid,date,time,text,text,text) from public;
grant execute on function public.create_public_booking(uuid,uuid,uuid,date,time,text,text,text)
  to anon, authenticated, service_role;

create or replace function public.get_available_slots(
  p_professional_id uuid,
  p_date date,
  p_service_duration integer
)
returns table(slot time without time zone)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_day_of_week integer;
  v_start_time time;
  v_end_time time;
  v_curr_time time;
  v_business_id uuid;
begin
  perform public.expire_stale_pending_payments();

  if p_service_duration is null or p_service_duration <= 0 then
    return;
  end if;

  select p.business_id
    into v_business_id
  from public.professionals p
  where p.id = p_professional_id
    and p.is_active = true;

  if v_business_id is null then
    return;
  end if;

  v_day_of_week := extract(dow from p_date);

  select a.start_time, a.end_time
    into v_start_time, v_end_time
  from public.availability_settings a
  where a.business_id = v_business_id
    and a.day_of_week = v_day_of_week
    and a.is_active = true
  order by a.created_at asc
  limit 1;

  if v_start_time is null or v_end_time is null then
    return;
  end if;

  v_curr_time := v_start_time;

  while v_curr_time + make_interval(mins => p_service_duration) <= v_end_time loop
    if public.has_appointment_capacity(
      p_professional_id,
      p_date,
      v_curr_time,
      p_service_duration,
      null
    ) then
      slot := v_curr_time;
      return next;
    end if;

    v_curr_time := v_curr_time + interval '30 minutes';
  end loop;
end;
$$;

revoke all on function public.get_available_slots(uuid,date,integer) from public;
grant execute on function public.get_available_slots(uuid,date,integer)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
