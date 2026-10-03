# Playbook Operacional — Agenda Cleverya

Atualizado em: 2026-10-03

Este documento descreve o funcionamento atual da agenda Cleverya, os estados do agendamento, os fluxos de pagamento, os pontos de segurança e as integrações que podem reagir aos eventos da agenda.

## 1. Objetivo da agenda

A agenda Cleverya permite que cada empresa publique uma página própria de agendamento, com serviços, profissionais, disponibilidade, clientes e, quando configurado, cobrança de sinal via Mercado Pago.

A agenda pública é uma interface sobre regras que vivem no backend. O navegador não é a fonte de verdade para capacidade, pagamento ou autorização.

## 2. Entidades principais

### businesses
Representa a empresa/estabelecimento. É a raiz de isolamento multiempresa.

### business_members
Relaciona usuários autenticados às empresas que podem administrar.

### services
Serviços oferecidos pela empresa. Campos relevantes para agenda:
- nome;
- preço;
- duração em minutos;
- ativo/inativo;
- exigência de sinal.

### professionals
Profissionais da empresa. Campos relevantes:
- ativo/inativo;
- capacidade;
- serviços atendidos.

A capacidade pode ser maior que 1. Portanto, a agenda não usa apenas uma regra simples de unicidade por horário.

### availability_settings
Define janelas de atendimento usadas para montar os horários públicos.

### clients
Cadastro do cliente por empresa. A página pública não lê diretamente os dados pessoais desta tabela.

### blocked_clients
Controla clientes que não podem criar novo agendamento para a empresa.

### appointments
É o registro central da agenda.

Campos centrais:
- business_id;
- client_id;
- service_id;
- professional_id;
- appointment_date;
- appointment_time;
- status;
- deposit_expected_amount;
- deposit_paid;
- balance_paid;
- payment_currency;
- mp_preference_id;
- mp_payment_id;
- payment_expires_at;
- payment_checkout_url.

## 3. Fluxo público de agendamento

A página pública resolve a empresa por `get_public_business`.

Depois:
1. carrega serviços ativos;
2. carrega profissionais ativos;
3. filtra profissionais compatíveis com o serviço;
4. consulta `get_available_slots`;
5. coleta nome, telefone e e-mail do cliente;
6. chama `create_public_booking`.

O frontend não cria o cliente ou o agendamento diretamente.

## 4. Regra de disponibilidade

`get_available_slots(uuid,date,integer)` monta os horários com base em:
- disponibilidade da empresa;
- duração do serviço;
- capacidade do profissional;
- agendamentos ativos no mesmo intervalo.

A função `has_appointment_capacity` calcula a ocupação real considerando sobreposição de duração.

A proteção definitiva existe também no trigger `trg_enforce_appointment_capacity`.

Isso evita que duas solicitações concorrentes consigam ultrapassar a capacidade mesmo que ambas tenham visto o horário como livre no frontend.

## 5. Estados do agendamento

Estados atualmente relevantes:

### pending
Agendamento sem sinal aguardando confirmação/gestão.

Ocupa capacidade.

### pending_payment
Reserva criada para serviço que exige sinal.

Ocupa capacidade enquanto `payment_expires_at` não venceu.

### confirmed
Agendamento confirmado.

Ocupa capacidade.

Quando há sinal, o webhook do Mercado Pago grava:
- `deposit_paid`;
- `mp_payment_id`;
- status `confirmed`.

### completed
Atendimento realizado.

Não precisa continuar bloqueando uma vaga futura.

### cancelled
Agendamento cancelado.

Não ocupa capacidade.

### payment_expired
Reserva cujo prazo para pagamento venceu sem pagamento aprovado.

Não ocupa capacidade e preserva o histórico.

### payment_conflict
Pagamento aprovado chegou quando a reserva já havia expirado e a capacidade já não permitia recuperar a vaga.

Este estado preserva o fato financeiro para tratamento operacional em vez de esconder ou sobrescrever o conflito.

## 6. Serviços sem sinal

Para serviço sem sinal:

`create_public_booking`
→ cria appointment com `pending`
→ frontend conclui o fluxo sem Mercado Pago.

O e-mail de confirmação pode ser chamado pelo frontend no fluxo atual.

## 7. Serviços com sinal

Para serviço com sinal:

`create_public_booking`
→ cria `pending_payment`
→ grava `payment_expires_at = now() + 30 minutos`
→ chama Edge Function `create-payment`
→ Mercado Pago cria preferência
→ Cleverya grava snapshot do pagamento
→ cliente é direcionado ao checkout.

Snapshot:
- `deposit_expected_amount`;
- `payment_currency`;
- `mp_preference_id`;
- `payment_checkout_url`.

## 8. Idempotência do create-payment

Chamadas repetidas para o mesmo appointment não devem criar preferências novas.

Se uma preferência já existe:
- a URL persistida é reutilizada;
- se necessário, a função tenta recuperar a URL pela preferência existente.

Durante criação nova existe um claim temporário:
- `payment_creation_token`;
- `payment_creation_started_at`.

Ao final o claim é limpo.

Homologação realizada: retry retornou `reused = true` mantendo o mesmo `mp_preference_id`.

## 9. Expiração da reserva

O prazo padrão é 30 minutos.

`expire_stale_pending_payments()` transforma:
`pending_payment` vencido e sem pagamento
→ `payment_expired`.

`get_available_slots` também executa a expiração preguiçosa antes de montar os horários.

Com isso, um checkout abandonado não deve bloquear a agenda indefinidamente.

## 10. Webhook Mercado Pago

`mp-webhook`:
- valida assinatura;
- consulta o pagamento diretamente no Mercado Pago;
- compara `external_reference`;
- valida valor e moeda contra o snapshot;
- é idempotente para pagamento já processado;
- confirma o appointment quando possível.

Se o pagamento chegar após expiração:
- tenta confirmar novamente;
- se houver capacidade, recupera a reserva;
- se não houver capacidade, grava `payment_conflict`.

## 11. Segurança

Princípios atuais:
- isolamento por `business_id`;
- RLS nas tabelas críticas;
- PII de clientes não fica exposta ao `anon`;
- criação pública passa por RPC `SECURITY DEFINER` com retorno mínimo;
- credenciais Mercado Pago ficam em tabela sem acesso de `anon` ou `authenticated`;
- funções internas não devem ser executáveis por usuários públicos;
- service role é usada somente no backend.

## 12. Dashboard da agenda

A agenda autenticada permite visualizar compromissos por período e executar ações como:
- confirmar;
- concluir;
- cancelar;
- restaurar;
- excluir reservas abandonadas/expiradas;
- abrir WhatsApp manual com mensagem pré-montada.

Hoje o botão do WhatsApp apenas abre o aplicativo/web do WhatsApp; não existe envio automático via API.

## 13. WhatsApp atual

Existem três peças atuais:

### `src/lib/whatsapp.ts`
Gera texto e abre WhatsApp Web/app manualmente.

### `src/components/WhatsAppButton.tsx`
Botão de envio manual.

### `supabase/functions/send-reminders`
Busca agendamentos confirmados do dia seguinte e monta uma mensagem, porém apenas registra:

`[SIMULAÇÃO WHATSAPP]`

Não existe envio real.

## 14. Eventos da agenda que podem gerar automação WhatsApp

Mapa inicial para WA1:

| Evento | Origem confiável | Ação futura |
| --- | --- | --- |
| booking sem sinal criado | `create_public_booking` | confirmação |
| booking com sinal criado | `create_public_booking` | orientação de pagamento, se necessária |
| pagamento aprovado | `mp-webhook` | confirmação de pagamento/agendamento |
| pagamento expirado | `expire_stale_pending_payments` | aviso de expiração/reagendamento |
| cancelamento | atualização de appointment | mensagem de cancelamento |
| lembrete 24h | relógio + appointment confirmado | lembrete |
| atendimento concluído | atualização de appointment | pós-atendimento futuro |

## 15. Regra arquitetural para automações

O envio automático nunca deve ser acoplado diretamente à transação que altera a agenda.

Modelo desejado:

evento de negócio
→ grava item idempotente em outbox
→ dispatcher envia
→ registra resultado
→ retries seguros.

Assim, falha do WhatsApp não deve desfazer pagamento, confirmação ou agendamento.

## 16. Fonte de verdade

Para qualquer integração futura:
- agenda: banco Cleverya;
- capacidade: `has_appointment_capacity` + trigger;
- pagamento: Mercado Pago validado pelo backend + snapshot;
- mensagens: futura outbox WhatsApp.

IA ou WhatsApp não terão autorização para ignorar essas regras.

## 17. Regra para evolução

Qualquer nova função deve preservar:
1. multiempresa;
2. RLS;
3. idempotência;
4. trilha auditável;
5. compatibilidade com agenda existente;
6. ausência de secrets no frontend;
7. falha de integração externa sem corromper estado da agenda.
