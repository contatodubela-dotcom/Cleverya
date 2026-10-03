-- Cleverya - WA1A - FUNDACAO WhatsApp Automático
-- PREPARADA APENAS PARA REVISAO.
-- NAO APLICAR EM PRODUCAO antes da validacao arquitetural.
--
-- Objetivo: fundacao multiempresa, secrets segregados, settings, outbox
-- idempotente e trilha de entrega. Nenhum trigger de agenda e nenhum cron.

begin;

create table if not exists public.whatsapp_connections (
  business_id uuid primary key
    references public.businesses(id) on delete cascade,
  provider text not null default 'meta_cloud'
    check (provider in ('meta_cloud')),
  waba_id text,
  phone_number_id text,
  display_phone_number text,
  verified_name text,
  status text not null default 'disconnected'
    check (status in ('disconnected','pending','active','error')),
  connected_at timestamptz,
  last_webhook_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_number_id)
);

create table if not exists public.whatsapp_credentials (
  business_id uuid primary key
    references public.whatsapp_connections(business_id) on delete cascade,
  access_token text not null,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_automation_settings (
  business_id uuid primary key
    references public.businesses(id) on delete cascade,
  enabled boolean not null default false,
  booking_confirmation_enabled boolean not null default false,
  payment_confirmation_enabled boolean not null default false,
  payment_expiration_enabled boolean not null default false,
  cancellation_enabled boolean not null default false,
  reminder_24h_enabled boolean not null default false,
  default_language text not null default 'pt_BR'
    check (default_language in ('pt_BR','en_US')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  appointment_id uuid
    references public.appointments(id) on delete set null,
  event_type text not null
    check (event_type in (
      'booking_confirmed',
      'payment_confirmed',
      'payment_expired',
      'appointment_cancelled',
      'appointment_reminder_24h'
    )),
  recipient_phone text not null,
  template_name text not null,
  template_language text not null default 'pt_BR'
    check (template_language in ('pt_BR','en_US')),
  template_params jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'queued'
    check (status in ('queued','processing','sent','failed','skipped')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz not null default now(),
  claimed_at timestamptz,
  claim_token uuid,
  provider_message_id text,
  sent_at timestamptz,
  last_error_code text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_outbox_dispatch_idx
  on public.whatsapp_outbox (status, next_attempt_at, created_at)
  where status in ('queued','failed','processing');

create index if not exists whatsapp_outbox_business_idx
  on public.whatsapp_outbox (business_id, created_at desc);

create index if not exists whatsapp_outbox_appointment_idx
  on public.whatsapp_outbox (appointment_id, created_at desc)
  where appointment_id is not null;

create table if not exists public.whatsapp_delivery_events (
  id bigserial primary key,
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  outbox_id uuid
    references public.whatsapp_outbox(id) on delete set null,
  provider_message_id text,
  dedupe_key text not null unique,
  event_type text not null
    check (event_type in ('accepted','sent','delivered','read','failed')),
  event_at timestamptz,
  error_code text,
  error_message text,
  provider_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_delivery_events_message_idx
  on public.whatsapp_delivery_events (provider_message_id, created_at);

create index if not exists whatsapp_delivery_events_business_idx
  on public.whatsapp_delivery_events (business_id, created_at desc);

-- Claim atomico do outbox. O dispatcher recebe itens ja marcados como processing.
create or replace function public.claim_whatsapp_outbox(
  p_limit integer default 20
)
returns setof public.whatsapp_outbox
language plpgsql
security definer
set search_path = public, pg_temp
as $wa1a$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'WHATSAPP_CLAIM_LIMIT_INVALID' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select o.id
    from public.whatsapp_outbox o
    where o.status in ('queued','failed','processing')
      and o.attempts < o.max_attempts
      and o.next_attempt_at <= now()
      and (
        o.status <> 'processing'
        or o.claimed_at is null
        or o.claimed_at < now() - interval '5 minutes'
      )
    order by o.next_attempt_at asc, o.created_at asc
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update public.whatsapp_outbox o
    set
      status = 'processing',
      attempts = o.attempts + 1,
      claimed_at = now(),
      claim_token = gen_random_uuid(),
      updated_at = now()
    from candidates c
    where o.id = c.id
    returning o.*
  )
  select * from claimed;
end;
$wa1a$;

revoke all on function public.claim_whatsapp_outbox(integer) from public;
revoke all on function public.claim_whatsapp_outbox(integer) from anon;
revoke all on function public.claim_whatsapp_outbox(integer) from authenticated;
grant execute on function public.claim_whatsapp_outbox(integer) to service_role;

alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_credentials enable row level security;
alter table public.whatsapp_automation_settings enable row level security;
alter table public.whatsapp_outbox enable row level security;
alter table public.whatsapp_delivery_events enable row level security;

-- Remove qualquer grant implicito antes de liberar o conjunto minimo.
revoke all on table public.whatsapp_connections from public, anon, authenticated;
revoke all on table public.whatsapp_credentials from public, anon, authenticated;
revoke all on table public.whatsapp_automation_settings from public, anon, authenticated;
revoke all on table public.whatsapp_outbox from public, anon, authenticated;
revoke all on table public.whatsapp_delivery_events from public, anon, authenticated;

grant select on table public.whatsapp_connections to authenticated;
grant select, insert, update on table public.whatsapp_automation_settings to authenticated;
grant select on table public.whatsapp_outbox to authenticated;

grant select, insert, update, delete
  on table public.whatsapp_connections,
           public.whatsapp_credentials,
           public.whatsapp_automation_settings,
           public.whatsapp_outbox,
           public.whatsapp_delivery_events
  to service_role;

grant usage, select on sequence public.whatsapp_delivery_events_id_seq
  to service_role;

drop policy if exists whatsapp_connections_members_select
  on public.whatsapp_connections;
create policy whatsapp_connections_members_select
on public.whatsapp_connections
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists whatsapp_settings_members_select
  on public.whatsapp_automation_settings;
create policy whatsapp_settings_members_select
on public.whatsapp_automation_settings
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists whatsapp_settings_members_insert
  on public.whatsapp_automation_settings;
create policy whatsapp_settings_members_insert
on public.whatsapp_automation_settings
for insert
to authenticated
with check (public.is_business_member(business_id));

drop policy if exists whatsapp_settings_members_update
  on public.whatsapp_automation_settings;
create policy whatsapp_settings_members_update
on public.whatsapp_automation_settings
for update
to authenticated
using (public.is_business_member(business_id))
with check (public.is_business_member(business_id));

drop policy if exists whatsapp_outbox_members_select
  on public.whatsapp_outbox;
create policy whatsapp_outbox_members_select
on public.whatsapp_outbox
for select
to authenticated
using (public.is_business_member(business_id));

drop policy if exists whatsapp_delivery_members_select
  on public.whatsapp_delivery_events;

-- whatsapp_delivery_events fica service_role-only na WA1A.
-- O painel futuro devera usar RPC/view sanitizada.
-- whatsapp_credentials intencionalmente NAO possui policy para usuarios.
-- Apenas service_role recebe privilegio direto.

commit;
