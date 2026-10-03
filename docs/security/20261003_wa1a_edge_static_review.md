# WA1A — Revisão estática das Edge Functions

Data: 2026-10-03
Status: REVISÃO CONCLUÍDA, SEM DEPLOY

## Arquivos revisados

- `supabase/functions/whatsapp-webhook/index.ts`
- `supabase/functions/whatsapp-dispatch/index.ts`
- referências de padrão:
  - `mp-webhook`
  - `create-payment`
  - `send-reminders`

## whatsapp-webhook

Validado:
- GET de verificação com verify token;
- POST com body bruto preservado antes do parse;
- validação HMAC SHA-256 via `x-hub-signature-256`;
- resolução multiempresa por `phone_number_id`;
- gravação idempotente de delivery events por `dedupe_key`;
- atualização de falha na outbox;
- nenhuma resposta automática para mensagens recebidas na WA1A;
- secrets somente no backend.

Risco aceito para fase:
- processamento é síncrono. Se o volume crescer, poderá ser necessário separar ingestão do webhook da persistência detalhada.
- delivery status fica em tabela separada; `whatsapp_outbox.status` continua representando o estado do envio interno, não toda a cadeia delivered/read.

## whatsapp-dispatch

Validado:
- endpoint interno protegido por secret dedicado;
- claim atômico via RPC;
- leitura de credenciais somente com service role;
- exige conexão ativa;
- exige automação habilitada;
- envio por template;
- retry com backoff;
- limite de tentativas;
- persistência do provider message id;
- atualização condicionada pelo claim token;
- nenhum secret no frontend.

## Correção arquitetural encontrada

A primeira versão do dispatcher prefixava `55` para números curtos.

Isso seria incompatível com uma Cleverya bilíngue/internacional, especialmente com operação em inglês.

A lógica foi corrigida:
- número iniciado por `+` é tratado como internacional explícito;
- caso contrário, usa `default_country_calling_code` da empresa;
- não existe mais DDI 55 hardcoded no dispatcher.

Como a fundação WA1A já havia sido aplicada, a correção de banco foi separada em:
`20261003123000_whatsapp_wa1a1_phone_internationalization.sql`

Essa migration adiciona:
- `default_country_calling_code` em `whatsapp_automation_settings`;
- default 55 para retrocompatibilidade;
- backfill 1 quando default_language é `en_US`;
- validação de DDI entre 1 e 3 dígitos, sem zero inicial.

## Sem deploy

Nenhuma das funções WhatsApp foi deployada nesta revisão.

Nenhum cliente recebeu mensagem.

Nenhum evento de agenda/pagamento foi conectado à outbox.

## Próxima autorização

Antes de deploy:
1. aplicar WA1A.1;
2. executar audit WA1A.1;
3. validar DDI/defaults;
4. revisar lista de secrets;
5. só então fazer deploy controlado.
