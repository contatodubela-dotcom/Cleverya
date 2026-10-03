-- Cleverya - Fase 1C.3 - protecao transacional contra dupla reserva
-- Instala guarda de capacidade/duracao no banco e alinha get_available_slots.
-- IMPORTANTE: aborta se houver conflito ATIVO futuro preexistente acima da capacidade.

begin;

-- ---------------------------------------------------------------------------
-- 0. Guarda de rollout: nao instala a protecao sobre agenda futura ja inconsistente.
-- ---------------------------------------------------------------------------

do $$
declare
  v_conflicts integer;
begin
  with active as (
    select
      a.id,
      a.professional_id,
      coalesce(p.capacity, 1) as capacity,
      (a.appointment_date::timestamp + a.appointment_time) as starts_at,
      (a.appointment_date::timestamp + a.appointment_time
        + make_interval(mins => s.duration_minutes)) as ends_at
    from public.appointments a
    join public.services s on s.id = a.service_id
    join public.professionals p on p.id = a.professional_id
    where a.appointment_date >= current_date
      and a.status in ('pending', 'pending_payment', 'confirmed')
  ),
  points as (
    select distinct
      a.professional_id,
      a.capacity,
      a.starts_at as point
    from active a
  ),
  loads as (
    select
      pt.professional_id,
      pt.capacity,
      pt.point,
      count(a.id) as occupancy
    from points pt
    join active a
      on a.professional_id = pt.professional_id
     and a.starts_at <= pt.point
     and a.ends_at > pt.point
    group by pt.professional_id, pt.capacity, pt.point
  )
  select count(*)
    into v_conflicts
  from loads
  where occupancy > greatest(capacity, 1);

  if v_conflicts > 0 then
    raise exception
      'Abortando Fase 1C.3: existem % pontos de conflito futuro acima da capacidade. Limpe os agendamentos abandonados/conflitantes antes de aplicar.',
      v_conflicts;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 1. Helper interno: informa se ainda existe capacidade durante TODO o intervalo.
-- ---------------------------------------------------------------------------

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
      and a.status in ('pending', 'pending_payment', 'confirmed')
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
grant execute on function public.has_appointment_capacity(uuid,date,time,integer,uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- 2. Trigger: serializa escrita por profissional/dia e impede overbooking.
-- ---------------------------------------------------------------------------

create or replace function public.enforce_appointment_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_service_business_id uuid;
  v_duration integer;
  v_professional_business_id uuid;
begin
  -- Status que nao ocupam agenda podem passar.
  if new.status not in ('pending', 'pending_payment', 'confirmed') then
    return new;
  end if;

  if new.business_id is null
     or new.professional_id is null
     or new.service_id is null
     or new.appointment_date is null
     or new.appointment_time is null then
    raise exception 'APPOINTMENT_REQUIRED_FIELDS_MISSING'
      using errcode = '23502';
  end if;

  select s.business_id, s.duration_minutes
    into v_service_business_id, v_duration
  from public.services s
  where s.id = new.service_id;

  if v_duration is null or v_duration <= 0 then
    raise exception 'SERVICE_DURATION_INVALID'
      using errcode = '22023';
  end if;

  select p.business_id
    into v_professional_business_id
  from public.professionals p
  where p.id = new.professional_id;

  if v_service_business_id is distinct from new.business_id
     or v_professional_business_id is distinct from new.business_id then
    raise exception 'APPOINTMENT_BUSINESS_RELATION_INVALID'
      using errcode = '23514';
  end if;

  -- Uma transacao por profissional/dia entra na secao critica de cada vez.
  perform pg_advisory_xact_lock(
    hashtextextended(
      new.professional_id::text || '|' || new.appointment_date::text,
      0
    )
  );

  if not public.has_appointment_capacity(
    new.professional_id,
    new.appointment_date,
    new.appointment_time,
    v_duration,
    case when tg_op = 'UPDATE' then old.id else null end
  ) then
    raise exception 'SLOT_CAPACITY_EXCEEDED'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_appointment_capacity() from public;
revoke all on function public.enforce_appointment_capacity() from anon;
revoke all on function public.enforce_appointment_capacity() from authenticated;
grant execute on function public.enforce_appointment_capacity() to service_role;

drop trigger if exists trg_enforce_appointment_capacity on public.appointments;

create trigger trg_enforce_appointment_capacity
before insert or update of
  business_id,
  professional_id,
  service_id,
  appointment_date,
  appointment_time,
  status
on public.appointments
for each row
execute function public.enforce_appointment_capacity();

-- ---------------------------------------------------------------------------
-- 3. Slots publicos: mesma regra do trigger, incluindo pending_payment e capacity.
-- ---------------------------------------------------------------------------

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
