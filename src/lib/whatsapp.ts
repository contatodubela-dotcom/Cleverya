import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatPhoneForWhatsapp = (phone: string) => {
  // Remove tudo que não é número
  let cleanPhone = phone.replace(/\D/g, '');

  // Remove o zero inicial se houver (ex: 041...)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }

  // Se não tiver o código do país (55) e tiver tamanho de celular BR (10 ou 11 dígitos), adiciona
  if (cleanPhone.length <= 11) {
    cleanPhone = `55${cleanPhone}`;
  }

  return cleanPhone;
};

interface WhatsAppMessageData {
  date?: string | Date | null;
  time?: string | null;
  clientName?: string | null;
  serviceName?: string | null;
  professionalName?: string | null;
  businessName?: string | null;
}

export const createMessage = (
  type: 'confirm' | 'cancel' | 'reminder' | 'hello',
  data: WhatsAppMessageData,
) => {
  // Garante que os dados existam para não quebrar
  const date = data.date ? format(new Date(data.date), "dd 'de' MMMM", { locale: ptBR }) : '';
  const time = data.time ? data.time.slice(0, 5) : '';
  const client = data.clientName ? data.clientName.split(' ')[0] : 'Cliente'; // Pega só o primeiro nome
  const service = data.serviceName || 'serviço';
  const professional = data.professionalName || '';
  const business = data.businessName || 'Glaucia Bronze'; // Nome padrão caso falhe

  const messages = {
    // 1. Mensagem de Confirmação (Usada na Agenda)
    confirm: `Olá *${client}*! ✨\nPassando para confirmar seu agendamento de *${service}* com ${professional}.\n\n📅 Data: ${date}\n⏰ Horário: ${time}\n\nEstamos te esperando!`,
    
    // 2. Mensagem de Cancelamento
    cancel: `Oi *${client}*.\nInformamos que seu agendamento de ${service} para o dia ${date} precisou ser cancelado/alterado.\nPor favor, entre em contato para reagendarmos.`,
    
    // 3. Lembrete (Usada no botão de mensagem avulso)
    reminder: `Oie *${client}*! 💖\nLembrete do seu horário de *${service}* dia ${date} às ${time}.\n\nPosso confirmar sua presença?`,

    // 4. Genérico (Oi simples)
    hello: `Olá *${client}*, tudo bem? Passando para falar sobre seu agendamento.`
  };

  // Retorna a mensagem escolhida ou o 'hello' como padrão
  return encodeURIComponent(messages[type] || messages.hello);
};

export const openWhatsApp = (phone: string, message: string) => {
  if (!phone) return;
  
  const formattedPhone = formatPhoneForWhatsapp(phone);
  
  // Detecta se é celular para abrir o app direto, ou web para abrir o site
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const baseUrl = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';
  
  window.open(`${baseUrl}?phone=${formattedPhone}&text=${message}`, '_blank');
};