begin;

alter table public.appointments
  add column if not exists deposit_expected_amount numeric,
  add column if not exists payment_currency text,
  add column if not exists mp_preference_id text,
  add column if not exists mp_payment_id text;

comment on column public.appointments.deposit_expected_amount is
  'Valor do sinal congelado no momento da criação da preferência de pagamento.';

comment on column public.appointments.payment_currency is
  'Moeda esperada para o pagamento do sinal.';

comment on column public.appointments.mp_preference_id is
  'Identificador da preferência criada no Mercado Pago.';

comment on column public.appointments.mp_payment_id is
  'Identificador do pagamento aprovado no Mercado Pago.';

update public.appointments a
set
  deposit_expected_amount = round((s.price::numeric / 2), 2),
  payment_currency = 'BRL'
from public.services s
where a.service_id = s.id
  and a.status = 'pending_payment'
  and s.require_deposit = true
  and a.deposit_expected_amount is null
  and s.price is not null
  and s.price > 0;

create unique index if not exists appointments_mp_payment_id_uidx
  on public.appointments (mp_payment_id)
  where mp_payment_id is not null;

commit;