# Cleverya — Checkpoint Segurança Fase 1B

Data: 2026-10-02

## Estado validado

- RLS endurecido nas tabelas críticas do booking.
- Booking público migrou de leitura/escrita direta para RPCs SECURITY DEFINER com retorno mínimo.
- `create_public_booking` homologado em produção.
- `get_public_business` homologado em produção.
- `get_public_booking_metrics` homologado em produção.
- `get_usage_metrics` fechado para `anon` e limitado ao próprio usuário autenticado (ou service_role).
- Grants excessivos de `anon` removidos das tabelas sensíveis.
- Trigger functions retiradas da superfície RPC pública.
- `search_path = public, pg_temp` aplicado às funções SECURITY DEFINER relevantes.
- Fluxo Mercado Pago ponta a ponta validado após o hardening:
  booking -> pending_payment -> create-payment -> Mercado Pago -> webhook -> confirmed.
- Produção Cloudflare validada na main após hotfix de métricas públicas.

## Migrations da fase

- 20261002213000_rls_hardening_fase1b.sql
- 20261002223000_fix_public_booking_service_ids_text.sql
- 20261002233000_rls_hardening_fase1b2_grants_functions.sql
- 20261002235000_rls_hardening_fase1b3_usage_metrics.sql

## Hotfixes promovidos para main

- PR #1: compatibilidade do BookingPage com o novo RLS.
- PR #2: uso de `get_public_booking_metrics(p_slug)` no booking público.

## Próxima frente recomendada

Fase 1C — Integridade de agendamento / concorrência:

1. inventariar índices e constraints de `appointments`;
2. verificar risco de dupla reserva simultânea;
3. validar relação entre duração do serviço e sobreposição de horários;
4. adicionar proteção transacional no servidor sem depender apenas do frontend;
5. testar concorrência e idempotência antes de qualquer rollout.
