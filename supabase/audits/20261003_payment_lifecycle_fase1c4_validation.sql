-- Cleverya - Fase 1C.4 - validacao read-only do ciclo de pagamento

with columns as (
  select
    column_name,
    data_type,
    is_nullable,
    column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'appointments'
    and column_name in (
      'payment_expires_at',
      'payment_checkout_url',
      'payment_creation_token',
      'payment_creation_started_at'
    )
),
functions as (
  select
    p.proname,
    pg_get_function_identity_arguments(p.oid) as args,
    p.prosecdef as security_definer,
    p.proconfig as config,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'expire_stale_pending_payments',
      'has_appointment_capacity',
      'create_public_booking',
      'get_available_slots'
    )
),
payment_state as (
  select
    status,
    count(*) as qty,
    count(*) filter (where payment_expires_at is not null) as with_expiry,
    count(*) filter (where mp_preference_id is not null) as with_preference,
    count(*) filter (where mp_payment_id is not null) as with_payment
  from public.appointments
  where status in (
    'pending_payment',
    'payment_expired',
    'payment_conflict',
    'confirmed'
  )
  group by status
),
stale_pending as (
  select count(*) as qty
  from public.appointments
  where status = 'pending_payment'
    and mp_payment_id is null
    and payment_expires_at is not null
    and payment_expires_at <= now()
),
legacy_pending as (
  select count(*) as qty
  from public.appointments
  where status = 'pending_payment'
    and mp_payment_id is null
    and mp_preference_id is not null
    and payment_expires_at is null
)
select
  '01_COLUMN' as section,
  column_name as object_name,
  jsonb_build_object(
    'data_type', data_type,
    'nullable', is_nullable,
    'default', column_default
  ) as detail
from columns

union all

select
  '02_FUNCTION',
  proname || '(' || args || ')',
  jsonb_build_object(
    'security_definer', security_definer,
    'config', config,
    'anon_execute', anon_execute,
    'authenticated_execute', authenticated_execute,
    'service_role_execute', service_role_execute
  )
from functions

union all

select
  '03_PAYMENT_STATE',
  status,
  jsonb_build_object(
    'qty', qty,
    'with_expiry', with_expiry,
    'with_preference', with_preference,
    'with_payment', with_payment
  )
from payment_state

union all

select
  '04_STALE_PENDING',
  'pending_payment_expired_but_not_marked',
  jsonb_build_object('qty', qty)
from stale_pending

union all

select
  '05_LEGACY_PENDING',
  'legacy_preference_without_expiry',
  jsonb_build_object('qty', qty)
from legacy_pending

order by section, object_name;
