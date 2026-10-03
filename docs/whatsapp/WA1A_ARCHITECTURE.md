# WA1A — Arquitetura da Fundação WhatsApp Automático

Status: PROPOSTA PARA VALIDAÇÃO
Produção: NÃO APLICADA
Branch: `feat/whatsapp-wa1a-foundation-03out2026`

## 1. Objetivo

Criar a fundação multiempresa para WhatsApp Business Platform oficial, sem ativar mensagens automáticas ainda.

A WA1A prepara:
- conexão de WhatsApp por empresa;
- armazenamento isolado de credencial;
- configurações de automação;
- outbox idempotente;
- trilha de entrega;
- webhook oficial;
- dispatcher backend.

## 2. Premissas

A integração deve usar WhatsApp Business Platform / Cloud API oficial.

Para envio pela Cloud API são necessários ativos como WhatsApp Business Account, número registrado e Phone Number ID. A conexão usa credenciais autorizadas no backend.

Webhooks usam:
- GET para validação do callback com verify token;
- POST para eventos;
- validação criptográfica do POST com App Secret.

Mensagens proativas, como confirmação ou lembrete, devem ser tratadas como templates aprovados quando a janela de atendimento não permite texto livre. Por isso a arquitetura não grava textos livres como regra de envio transacional: grava `template_name`, idioma e parâmetros.

## 3. Separação por empresa

Cada `business_id` terá no máximo uma conexão ativa na primeira versão.

Metadados não secretos ficam em:
`whatsapp_connections`.

Credencial sensível fica separada em:
`whatsapp_credentials`.

Nenhum token é retornado ao navegador.

## 4. Tabelas propostas

### whatsapp_connections
Metadados da conexão:
- business_id;
- provider;
- waba_id;
- phone_number_id;
- display_phone_number;
- verified_name;
- status;
- connected_at;
- last_webhook_at.

Usuários da empresa podem consultar o status, mas não recebem secrets.

### whatsapp_credentials
Somente service_role:
- business_id;
- access_token;
- token_expires_at.

Nenhuma policy para `anon` ou `authenticated`.

### whatsapp_automation_settings
Configurações por empresa:
- master enabled;
- booking confirmation;
- payment confirmation;
- payment expiration;
- cancellation;
- reminder 24h;
- idioma padrão.

WA1A cria o modelo. WA1C será o painel de configuração.

### whatsapp_outbox
Fila transacional idempotente.

Campos importantes:
- business_id;
- appointment_id;
- event_type;
- recipient_phone;
- template_name;
- template_language;
- template_params;
- dedupe_key;
- status;
- attempts;
- next_attempt_at;
- provider_message_id;
- erro.

`dedupe_key` é UNIQUE.

Exemplo:
`payment_confirmed:<appointment_id>:<mp_payment_id>`

Mesmo que o webhook Mercado Pago seja entregue várias vezes, apenas uma mensagem entra na fila.

### whatsapp_delivery_events
Trilha dos estados enviados pelo provedor:
- accepted;
- sent;
- delivered;
- read;
- failed.

Serve para auditoria e painel futuro. O payload bruto do provedor permanece `service_role`-only; o painel futuro deverá consumir somente uma view/RPC sanitizada.

## 5. Fluxo de envio

Evento de negócio ocorre
→ backend insere outbox com dedupe key
→ commit do evento termina
→ dispatcher busca itens `queued`
→ valida conexão ativa e configuração
→ envia template via Graph API
→ grava `provider_message_id`
→ marca `sent` ou `failed`.

Não haverá chamada à Meta dentro de trigger SQL.

## 6. Retry

O dispatcher deve:
- bloquear/claimar um item antes de enviar;
- incrementar `attempts`;
- usar backoff;
- nunca criar nova linha para o mesmo `dedupe_key`;
- permitir replay controlado de falhas.

WA1A limita `max_attempts` inicialmente a 5 no modelo.

## 7. Webhook Meta

Edge Function proposta: `whatsapp-webhook`.

GET:
- valida `hub.verify_token`;
- devolve `hub.challenge`.

POST:
- preserva body bruto;
- valida `x-hub-signature-256` com App Secret;
- resolve empresa pelo `phone_number_id`;
- atualiza `last_webhook_at`;
- grava delivery events.

Mensagens recebidas dos clientes serão apenas registradas/minimamente reconhecidas na WA1A. Resposta bidirecional pertence à WA2.

## 8. Dispatcher

Edge Function proposta: `whatsapp-dispatch`.

WA1A terá a função preparada, mas sem cron e sem gatilhos de produção até homologação.

Responsabilidades:
- service-role only;
- claim do outbox;
- leitura de credencial por business_id;
- envio de template;
- persistência do resultado.

## 9. Templates iniciais previstos

Nomes definitivos dependem de aprovação na Meta.

Eventos:
- `booking_confirmed`;
- `payment_confirmed`;
- `payment_expired`;
- `appointment_cancelled`;
- `appointment_reminder_24h`.

A WA1A não presume que um template está aprovado. A conexão só deve enviar quando houver mapeamento válido.

## 10. O que NÃO será feito na WA1A

- nenhum deploy de Edge Function;
- nenhuma migration aplicada em produção;
- nenhum cron;
- nenhum disparo para cliente real;
- nenhum token real commitado;
- nenhuma mudança no fluxo atual de `send-reminders`;
- nenhuma alteração automática de appointment pelo WhatsApp;
- nenhuma IA.

## 11. Critérios para autorizar WA1B

Antes de produção:
1. revisar migration;
2. executar preflight read-only;
3. aplicar em ambiente controlado;
4. validar RLS/grants;
5. testar webhook GET;
6. testar assinatura POST;
7. configurar um número de teste;
8. inserir outbox de teste;
9. comprovar dedupe;
10. comprovar delivery status;
11. só então ligar eventos reais da agenda.

## 12. Decisões arquiteturais

- API oficial, não WhatsApp Web automatizado.
- Um número pertence a uma empresa na primeira versão.
- Tokens segregados dos metadados.
- Outbox é a fronteira entre agenda e mensageria.
- Falha do WhatsApp nunca reverte agendamento/pagamento.
- Templates e janela de atendimento são tratados explicitamente.
- IA somente em fase posterior e sempre subordinada às regras da agenda.


## 13. Bilinguismo

A Cleverya já opera em Português e Inglês. A integração WhatsApp deve manter essa capacidade desde a fundação.

Regras:
- idiomas suportados inicialmente: `pt_BR` e `en_US`;
- `whatsapp_automation_settings.default_language` define o padrão por empresa;
- cada item da `whatsapp_outbox` persiste `template_language`;
- templates Meta serão cadastrados por evento e idioma;
- fallback futuro: idioma do cliente → idioma padrão da empresa → `pt_BR`;
- nenhuma mensagem transacional deve ser montada somente a partir do idioma momentâneo do frontend.

WA1C deverá expor a seleção do idioma padrão no painel.
