# Cleverya — Fechamento Fase 1C.4

A Fase 1C.4 endurece o ciclo de pagamento de reservas públicas.

## Cobertura implementada

- prazo de 30 minutos para `pending_payment`;
- `payment_expires_at` como fonte de verdade;
- reuso do checkout e da mesma preferência Mercado Pago;
- claim efêmero para evitar criação concorrente de preferências;
- expiração de reservas sem pagamento para `payment_expired`;
- liberação de capacidade após expiração;
- tratamento de pagamento tardio com `payment_conflict` quando a vaga já foi ocupada;
- UX para horário ocupado, pagamento expirado e criação em andamento;
- dashboard capaz de exibir e limpar reservas expiradas.

## Homologações já realizadas

- criação de reserva com prazo: OK;
- preferência Mercado Pago criada e persistida: OK;
- retry do `create-payment`: mesma preferência reutilizada;
- retorno explícito `reused = true`: OK;
- constraint de status ampliada e validada;
- expiração de registro antigo para `payment_expired`: OK.

## Homologação final one-shot

O arquivo:

`supabase/audits/20261003_payment_lifecycle_fase1c4_one_shot.sql`

é direcionado ao agendamento de teste:

`a832214d-c3f1-462f-9362-227b0c7b7d9f`

Ele aborta se houver pagamento, se o prazo ainda não tiver vencido ou se o estado for inesperado. Depois do vencimento, muda somente esse registro para `payment_expired` e valida se o horário voltou a ter capacidade e voltou a aparecer em `get_available_slots`.

Resultado final esperado: `homologacao_ok = true`.
