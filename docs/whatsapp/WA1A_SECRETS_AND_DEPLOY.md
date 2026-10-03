# WA1A — Secrets e configuração de deploy

Status: PREPARADO, AINDA SEM DEPLOY

## Variáveis usadas pelas Edge Functions

### Fornecidas pelo Supabase hospedado
As funções usam as variáveis internas do projeto:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Não copiar esses valores para frontend, documentação ou Git.

### Secrets que precisam ser configurados antes da homologação

#### `WHATSAPP_VERIFY_TOKEN`
Token aleatório controlado pela Cleverya.

Usado somente no GET de validação do webhook Meta.

Não é o access token do WhatsApp.

#### `META_APP_SECRET`
App Secret do aplicativo Meta que receberá os webhooks.

Usado para validar `x-hub-signature-256` dos POSTs.

Nunca deve ser commitado ou enviado no frontend.

#### `WHATSAPP_DISPATCH_SECRET`
Secret interno da Cleverya para autorizar chamadas ao dispatcher.

Não é token Meta.

#### `META_GRAPH_API_VERSION`
Versão da Graph API suportada pelo aplicativo Meta no momento da configuração.

É configuração, não credencial. Deve ser definida explicitamente para evitar mudança silenciosa de versão.

## Credencial por empresa

O access token usado para enviar mensagens NÃO é secret global da Edge Function.

Ele fica em:
`public.whatsapp_credentials`

vinculado ao `business_id`, protegido por RLS/grants e acessível somente via service role.

Isso preserva o desenho multiempresa.

## Política de endpoints

`whatsapp-webhook`:
- `verify_jwt = false`;
- GET autenticado por `WHATSAPP_VERIFY_TOKEN`;
- POST autenticado pela assinatura Meta usando `META_APP_SECRET`.

`whatsapp-dispatch`:
- `verify_jwt = false`;
- POST autenticado pelo header interno `x-cleverya-dispatch-secret`;
- comparação do secret feita em tempo constante.

Nenhum dos dois endpoints confia em acesso público sem validação própria.

## Regra operacional

Nunca:
- colar secrets neste chat;
- commitá-los em `.env`;
- salvá-los em arquivo versionado;
- colocar service role no frontend;
- usar access token de uma empresa para outra empresa.

## Estado atual

Nenhum secret WA1A foi configurado por este documento.
Nenhuma Edge Function WhatsApp foi deployada.
Nenhum evento real está ligado à outbox.
