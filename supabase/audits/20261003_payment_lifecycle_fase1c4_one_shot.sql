-- Cleverya - Fase 1C.4 - homologacao final one-shot
-- Alvo controlado: agendamento de teste criado apos o deploy da Fase 1C.4.
-- Objetivo:
--   1) confirmar que o prazo venceu;
--   2) expirar SOMENTE este pending_payment de teste;
--   3) confirmar que deixou de ocupar capacidade;
--   4) confirmar que o slot voltou a ser oferecido.
--
-- Seguro para reexecucao: depois da primeira execucao, nao altera novamente o registro.
-- Nao apaga dados e nao toca em pagamentos confirmados.

do $$
declare
  v_target_id constant uuid := 'a832214d-c3f1-462f-9362-227b0c7b7d9f';
  v_status text;
  v_payment_id text;
  v_expires_at timestamptz;
begin
  select
    a.status,
    a.mp_payment_id,
    a.payment_expires_at
  into
    v_status,
    v_payment_id,
    v_expires_at
  from public.appointments a
  where a.id = v_target_id;

  if not found then
    raise exception 'HOMOLOGACAO_1C4_TARGET_NOT_FOUND';
  end if;

  if v_payment_id is not null then
    raise exception 'HOMOLOGACAO_1C4_ABORT_PAYMENT_PRESENT';
  end if;

  if v_status = 'pending_payment' then
    if v_expires_at is null then
      raise exception 'HOMOLOGACAO_1C4_ABORT_EXPIRY_MISSING';
    end if;

    if v_expires_at > now() then
      raise exception
        'HOMOLOGACAO_1C4_NOT_EXPIRED_YET: expira em %',
        v_expires_at;
    end if;

    update public.appointments
    set
      status = 'payment_expired',
      payment_creation_token = null,
      payment_creation_started_at = null
    where id = v_target_id
      and status = 'pending_payment'
      and mp_payment_id is null
      and payment_expires_at <= now();
  elsif v_status <> 'payment_expired' then
    raise exception
      'HOMOLOGACAO_1C4_ABORT_UNEXPECTED_STATUS: %',
      v_status;
  end if;
end
$$;

with target as (
  select
    a.id,
    a.status,
    a.business_id,
    a.professional_id,
    a.service_id,
    a.appointment_date,
    a.appointment_time,
    a.payment_expires_at,
    a.mp_preference_id,
    a.mp_payment_id,
    a.deposit_paid,
    s.duration_minutes
  from public.appointments a
  join public.services s on s.id = a.service_id
  where a.id = 'a832214d-c3f1-462f-9362-227b0c7b7d9f'::uuid
),
capacity_check as (
  select
    t.id,
    public.has_appointment_capacity(
      t.professional_id,
      t.appointment_date,
      t.appointment_time,
      t.duration_minutes,
      null
    ) as has_capacity
  from target t
),
slot_check as (
  select exists (
    select 1
    from target t,
    lateral public.get_available_slots(
      t.professional_id,
      t.appointment_date,
      t.duration_minutes
    ) s
    where s.slot = t.appointment_time
  ) as slot_is_available
)
select
  t.id,
  t.status,
  t.appointment_date,
  t.appointment_time,
  t.payment_expires_at,
  t.mp_preference_id,
  t.mp_payment_id,
  t.deposit_paid,
  c.has_capacity,
  s.slot_is_available,
  (
    t.status = 'payment_expired'
    and t.mp_payment_id is null
    and coalesce(t.deposit_paid, 0) = 0
    and c.has_capacity
    and s.slot_is_available
  ) as homologacao_ok
from target t
cross join capacity_check c
cross join slot_check s;
