# Cleverya — Fase 1A Hardening Mercado Pago

Este pacote foi preparado sobre os arquivos atuais enviados em 28/09/2026.

## Conteúdo
- `src/pages/BookingPage.tsx`
- `src/components/dashboard/AvailabilitySettings.tsx`
- `supabase/functions/create-payment/index.ts`
- `supabase/functions/mp-webhook/index.ts`
- `supabase/functions/mp-auth-callback/index.ts`
- `supabase/functions/mp-account/index.ts` (nova)
- `supabase/migrations/20260928230000_mp_hardening_fase1a_prepare.sql`
- `supabase/migrations/20260928235900_mp_hardening_fase1a_finalize.sql`

## Mudanças principais
- O navegador não lê nem grava `mp_access_token`.
- OAuth deixa de usar `business_id` puro como `state`.
- `state` passa a ser assinado com HMAC, com validade de 10 minutos.
- `create-payment` recebe apenas `appointment_id` e busca dados confiáveis no banco.
- `mp-webhook` valida assinatura, `external_reference`, moeda e valor esperado.
- Credenciais Mercado Pago migram para `public.business_payment_credentials`, com RLS habilitado, sem policies para anon/authenticated e privilégios revogados desses papéis; apenas `service_role` recebe acesso explícito.
- Corrigidos `any`, `unknown`, `catch` vazio e variáveis não usadas nas funções MP.

## IMPORTANTE
NÃO execute migrations e NÃO faça deploy ainda apenas por ter extraído este pacote.

Primeiro:
1. substituir/copiar os arquivos localmente;
2. rodar `npm run lint`;
3. rodar `npm run build`;
4. revisar `git status -sb` e `git diff --stat`.

Depois disso, aplicar a etapa PREPARE, configurar secrets e fazer deploy em ordem controlada.

## Secrets necessários antes do deploy
- `MP_CLIENT_ID`
- `MP_CLIENT_SECRET`
- `MP_OAUTH_STATE_SECRET` (novo; segredo aleatório forte)
- `MP_WEBHOOK_SECRET` (novo; segredo de assinatura do Webhook no painel Mercado Pago)
- `CLEVERYA_APP_URL=https://www.cleverya.com` (recomendado)
- `MP_REDIRECT_URI=https://bxglxltapbagjmmkagfm.supabase.co/functions/v1/mp-auth-callback` (recomendado)

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são esperados nas Edge Functions.

## Deploy esperado posteriormente
- `mp-account`: JWT obrigatório
- `mp-auth-callback`: JWT desabilitado (callback externo; autenticação pelo state assinado)
- `create-payment`: JWT desabilitado enquanto o booking público for anônimo
- `mp-webhook`: JWT desabilitado (origem externa; autenticação por assinatura Mercado Pago)

A migration FINALIZE só deve ser executada após todos os testes acima.


## REV 2 — compatibilidade Supabase/PostgREST
A primeira versão do pacote usava `.schema("private")` nas Edge Functions.
Isso exigiria expor o schema `private` ao PostgREST, o que não é desejável para uma tabela de credenciais.

A REV 2 mantém a tabela no schema `public`, porém fechada por RLS + REVOKE e acessível somente ao `service_role`.
Esta é a versão que deve ser aplicada.
