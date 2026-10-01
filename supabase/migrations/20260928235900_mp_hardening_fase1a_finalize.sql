-- Cleverya - Mercado Pago hardening Fase 1A (FINALIZE) - REV 3
-- EXECUTAR SOMENTE DEPOIS de:
-- 1) novas Edge Functions estarem deployadas;
-- 2) mp-account/status funcionar;
-- 3) create-payment usar business_payment_credentials;
-- 4) OAuth novo ser validado;
-- 5) webhook oficial estar homologado.
--
-- Mantém a coluna mp_access_token em businesses por compatibilidade temporária,
-- mas remove seus valores do local antigo.

begin;

do $$
declare
  missing_businesses integer;
begin
  select count(*)
    into missing_businesses
  from public.businesses b
  where b.mp_access_token is not null
    and btrim(b.mp_access_token) <> ''
    and not exists (
      select 1
      from public.business_payment_credentials c
      where c.business_id = b.id
        and c.mp_access_token is not null
        and btrim(c.mp_access_token) <> ''
    );

  if missing_businesses > 0 then
    raise exception
      'Abortando FINALIZE: existem % empresas com token legado sem credencial migrada.',
      missing_businesses;
  end if;
end
$$;

update public.businesses
set mp_access_token = null
where mp_access_token is not null
  and btrim(mp_access_token) <> '';

commit;

-- VALIDAÇÃO READ-ONLY:
-- select
--   count(*) filter (
--     where mp_access_token is not null
--       and btrim(mp_access_token) <> ''
--   ) as old_tokens_remaining
-- from public.businesses;