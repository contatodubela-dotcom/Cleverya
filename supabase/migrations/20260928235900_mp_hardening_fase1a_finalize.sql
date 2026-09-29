-- Cleverya - Mercado Pago hardening Fase 1A (FINALIZE) - REV 2
-- EXECUTAR SOMENTE DEPOIS de:
-- 1) novas Edge Functions estarem deployadas;
-- 2) mp-account/status funcionar;
-- 3) create-payment usar business_payment_credentials;
-- 4) OAuth novo ser validado.
--
-- Mantém a coluna mp_access_token em businesses por compatibilidade temporária,
-- mas remove seus valores do local antigo.

begin;

do $$
declare
  old_tokens integer;
  migrated_tokens integer;
begin
  select count(*)
    into old_tokens
  from public.businesses
  where mp_access_token is not null
    and btrim(mp_access_token) <> '';

  select count(*)
    into migrated_tokens
  from public.business_payment_credentials
  where mp_access_token is not null
    and btrim(mp_access_token) <> '';

  if migrated_tokens < old_tokens then
    raise exception
      'Abortando: há % tokens em businesses e apenas % em business_payment_credentials.',
      old_tokens,
      migrated_tokens;
  end if;
end
$$;

update public.businesses
set mp_access_token = null
where mp_access_token is not null;

commit;

-- VALIDAÇÃO READ-ONLY:
-- select
--   count(*) filter (
--     where mp_access_token is not null and btrim(mp_access_token) <> ''
--   ) as old_tokens_remaining
-- from public.businesses;
