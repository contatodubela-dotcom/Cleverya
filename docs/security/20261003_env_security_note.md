# WA1A — Nota de segurança de configuração local

Durante a revisão foi identificado que o repositório possui um arquivo `.env` versionado.

A inspeção realizada considerou somente os nomes/estado das variáveis e não registrou valores em documentação. No estado revisado, as variáveis versionadas aparentam ser placeholders, mas a prática recomendada para a etapa final de hardening é:
- manter um `.env.example` sem secrets;
- ignorar `.env` real no Git;
- revisar histórico antes da venda;
- rotacionar qualquer credencial que tenha sido exposta em terminal, chat ou commit.

Essa limpeza não faz parte do deploy WA1A e não deve ser misturada à homologação do webhook.
