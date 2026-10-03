# Cleverya — Revisão ciclo de pagamento / reservas abandonadas

Data: 2026-10-02

## Achados no código atual

1. `pending_payment` ocupa capacidade sem prazo automático.
2. `create-payment` cria nova preferência a cada chamada; cliques/retries concorrentes podem gerar mais de uma preferência para o mesmo agendamento.
3. `mp-webhook` é idempotente para o mesmo `mp_payment_id`, mas um segundo pagamento diferente no mesmo agendamento pode chegar depois de o primeiro ter confirmado.
4. A exclusão de abandonados é manual no dashboard.
5. Não havia um prazo no banco que separasse "reserva aguardando pagamento" de "reserva expirada".
6. Após a Fase 1C.3, `pending_payment` também bloqueia a capacidade — correto enquanto o pagamento está vivo, mas exige expiração controlada.

## Correção preparada na Fase 1C.4

- reserva de vaga aguardando pagamento: 30 minutos;
- `payment_expires_at` como fonte de verdade no banco;
- `payment_checkout_url` para reutilizar a mesma preferência;
- claim efêmero de criação de preferência, evitando duas preferências simultâneas;
- expiração preguiçosa automática: slots e novos bookings marcam reservas vencidas como `payment_expired`;
- `has_appointment_capacity` deixa de contar `pending_payment` vencido;
- preferências novas do Mercado Pago recebem vigência até `payment_expires_at`;
- webhook passa a registrar pagamento tardio/conflitante em vez de perder o fato financeiro.

## Compatibilidade

Preferências Mercado Pago legadas já existentes e sem `payment_expires_at` não são expiradas automaticamente na migration. Isso evita liberar uma vaga enquanto um checkout antigo ainda puder ser pago.

## Referência Mercado Pago

Checkout Pro aceita `expires`, `expiration_date_from` e `expiration_date_to` para definir a vigência da preferência. O prazo é usado pela Fase 1C.4 para alinhar a reserva de vaga ao checkout.
