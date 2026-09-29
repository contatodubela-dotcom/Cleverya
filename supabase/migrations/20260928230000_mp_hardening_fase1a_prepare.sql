-- Cleverya - Mercado Pago hardening Fase 1A (PREPARE) - REV 2
-- Executar ANTES do deploy das novas Edge Functions.
-- Preserva os tokens atuais e NÃO remove ainda a coluna antiga de businesses.
--
-- A tabela fica no schema public para ser acessível às Edge Functions via
-- PostgREST/service_role, porém:
--   * RLS fica habilitado;
--   * não existem policies para anon/authenticated;
--   * privilégios são revogados de PUBLIC, anon e authenticated;
--   * somente service_role recebe acesso explícito.

begin;

create table if not exists public.business_payment_credentials (
  business_id uuid primary key
    references public.businesses(id)
    on delete cascade,
  mp_access_token text not null,
  mp_refresh_token text,
  mp_public_key text,
  mp_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_payment_credentials enable row level security;

revoke all on table public.business_payment_credentials from public;
revoke all on table public.business_payment_credentials from anon;
revoke all on table public.business_payment_credentials from authenticated;

grant select, insert, update, delete
  on table public.business_payment_credentials
  to service_role;

insert into public.business_payment_credentials (
  business_id,
  mp_access_token,
  updated_at
)
select
  id,
  mp_access_token,
  now()
from public.businesses
where mp_access_token is not null
  and btrim(mp_access_token) <> ''
on conflict (business_id)
do update set
  mp_access_token = excluded.mp_access_token,
  updated_at = now();

commit;

-- VALIDAÇÃO READ-ONLY:
-- select
--   count(*) as credentials_migrated,
--   count(*) filter (
--     where mp_access_token is not null and btrim(mp_access_token) <> ''
--   ) as credentials_with_token
-- from public.business_payment_credentials;
--
-- A consulta acima deve ser executada no SQL Editor por um papel administrativo.
