# Cleverya — Checkpoint WA1A Fundação WhatsApp

Atualizado em: 2026-10-03

## Status

WA1A — Fundação de Banco: VALIDADA

Produção:
- migration de fundação aplicada com sucesso;
- nenhuma Edge Function WhatsApp foi deployada;
- nenhum cron foi criado;
- nenhum evento real da agenda foi conectado à outbox;
- nenhuma mensagem automática foi enviada.

Branch de trabalho:
`feat/whatsapp-wa1a-foundation-03out2026`

## Estrutura aplicada

Tabelas:
- `whatsapp_connections`;
- `whatsapp_credentials`;
- `whatsapp_automation_settings`;
- `whatsapp_outbox`;
- `whatsapp_delivery_events`.

Função backend:
- `claim_whatsapp_outbox(integer)`.

## Segurança validada

Todas as tabelas WA1A estão com RLS habilitado.

`whatsapp_credentials`:
- anon sem SELECT;
- authenticated sem SELECT;
- service_role com SELECT.

`whatsapp_delivery_events`:
- anon sem SELECT;
- authenticated sem SELECT;
- service_role com SELECT.

`claim_whatsapp_outbox`:
- SECURITY DEFINER;
- anon sem EXECUTE;
- authenticated sem EXECUTE;
- service_role com EXECUTE.

A outbox possui `dedupe_key` UNIQUE.

O payload bruto de eventos do provedor permanece restrito ao backend.

## Idempotência e concorrência

A arquitetura usa:
- `dedupe_key` única por evento lógico;
- claim atômico;
- status `queued`, `processing`, `sent`, `failed`, `skipped`;
- limite de tentativas;
- `next_attempt_at`;
- recuperação de claim preso em `processing` após timeout.

## Idiomas

A Cleverya permanece bilíngue.

Idiomas iniciais suportados pela fundação WhatsApp:
- `pt_BR`;
- `en_US`.

`whatsapp_automation_settings.default_language` e
`whatsapp_outbox.template_language` são persistidos explicitamente.

## Edge Functions preparadas, ainda não deployadas

- `supabase/functions/whatsapp-webhook/index.ts`;
- `supabase/functions/whatsapp-dispatch/index.ts`.

## Próxima etapa

WA1A — Backend de Mensageria:

1. revisão estática de `whatsapp-webhook`;
2. revisão estática de `whatsapp-dispatch`;
3. confirmar variáveis/secrets necessários sem expor valores;
4. deploy controlado das funções;
5. homologar validação GET do webhook;
6. homologar assinatura POST;
7. homologar claim/dedupe com item controlado de outbox;
8. somente depois conectar eventos reais de agenda/pagamento.

## Regra de segurança

Até o fim dessa homologação:
- não ligar agendamento à outbox;
- não ligar Mercado Pago à outbox;
- não habilitar cron;
- não enviar mensagem para cliente real.
