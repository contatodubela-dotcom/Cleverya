-- Cleverya - WA1A.1 - Internacionalizacao de telefone WhatsApp
-- Correcao complementar da fundacao WA1A ja aplicada.
-- Nao envia mensagens, nao cria cron e nao conecta eventos da agenda.

begin;

alter table public.whatsapp_automation_settings
  add column if not exists default_country_calling_code text;

update public.whatsapp_automation_settings
set default_country_calling_code = case
  when default_language = 'en_US' then '1'
  else '55'
end
where default_country_calling_code is null
   or btrim(default_country_calling_code) = '';

alter table public.whatsapp_automation_settings
  alter column default_country_calling_code set default '55';

alter table public.whatsapp_automation_settings
  alter column default_country_calling_code set not null;

alter table public.whatsapp_automation_settings
  drop constraint if exists whatsapp_automation_settings_country_calling_code_check;

alter table public.whatsapp_automation_settings
  add constraint whatsapp_automation_settings_country_calling_code_check
  check (default_country_calling_code ~ '^[1-9][0-9]{0,2}$');

commit;
