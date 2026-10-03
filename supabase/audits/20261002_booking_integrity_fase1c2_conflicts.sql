-- Cleverya - Fase 1C.2 - diagnostico de conflitos/dupla reserva
-- SOMENTE LEITURA. Nao altera dados, schema, grants ou policies.

with base as (
  select
    a.id,
    a.business_id,
    a.professional_id,
    p.name as professional_name,
    coalesce(p.capacity, 1) as professional_capacity,
    a.service_id,
    s.name as service_name,
    s.duration_minutes,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.created_at,
    a.deposit_expected_amount,
    a.deposit_paid,
    a.mp_payment_id,
    (a.appointment_date::timestamp + a.appointment_time) as starts_at,
    (a.appointment_date::timestamp + a.appointment_time
      + make_interval(mins => s.duration_minutes)) as ends_at
  from public.appointments a
  left join public.services s on s.id = a.service_id
  left join public.professionals p on p.id = a.professional_id
),
active as (
  select *
  from base
  where status in ('pending','pending_payment','confirmed')
),
exact_groups as (
  select
    professional_id,
    appointment_date,
    appointment_time,
    count(*) as qty
  from active
  group by professional_id, appointment_date, appointment_time
  having count(*) > 1
),
overlaps as (
  select
    a.id as appointment_a,
    b.id as appointment_b,
    a.professional_id,
    a.professional_name,
    a.professional_capacity,
    a.appointment_date,
    a.appointment_time as start_a,
    a.ends_at::time as end_a,
    a.status as status_a,
    a.service_name as service_a,
    b.appointment_time as start_b,
    b.ends_at::time as end_b,
    b.status as status_b,
    b.service_name as service_b
  from active a
  join active b
    on b.professional_id = a.professional_id
   and b.appointment_date = a.appointment_date
   and b.id > a.id
   and a.starts_at < b.ends_at
   and b.starts_at < a.ends_at
)
select
  '01_EXACT_DUPLICATE_DETAIL' as section,
  b.id::text as object_name,
  jsonb_build_object(
    'professional_id', b.professional_id,
    'professional_name', b.professional_name,
    'capacity', b.professional_capacity,
    'date', b.appointment_date,
    'time', b.appointment_time,
    'status', b.status,
    'service_id', b.service_id,
    'service_name', b.service_name,
    'duration_minutes', b.duration_minutes,
    'created_at', b.created_at,
    'deposit_expected_amount', b.deposit_expected_amount,
    'deposit_paid', b.deposit_paid,
    'mp_payment_id_present', b.mp_payment_id is not null
  ) as detail
from base b
join exact_groups g
  on g.professional_id = b.professional_id
 and g.appointment_date = b.appointment_date
 and g.appointment_time = b.appointment_time

union all

select
  '02_OVERLAP_PAIR',
  o.appointment_a::text || '|' || o.appointment_b::text,
  jsonb_build_object(
    'professional_id', o.professional_id,
    'professional_name', o.professional_name,
    'capacity', o.professional_capacity,
    'date', o.appointment_date,
    'a', jsonb_build_object(
      'time', o.start_a,
      'end', o.end_a,
      'status', o.status_a,
      'service', o.service_a
    ),
    'b', jsonb_build_object(
      'time', o.start_b,
      'end', o.end_b,
      'status', o.status_b,
      'service', o.service_b
    )
  )
from overlaps o

union all

select
  '03_PROFESSIONAL_CAPACITY',
  p.id::text,
  jsonb_build_object(
    'name', p.name,
    'capacity', coalesce(p.capacity,1),
    'is_active', p.is_active
  )
from public.professionals p
where exists (
  select 1 from public.appointments a where a.professional_id = p.id
)

order by section, object_name;
