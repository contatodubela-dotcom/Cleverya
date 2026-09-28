// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendEmailPayload {
  to: string
  subject?: string
  html?: string
  clientName?: string
  serviceName?: string
  date?: string
  time?: string
  type?: 'confirmation' | 'reminder' | string
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildBookingHtml(payload: SendEmailPayload): string {
  const clientName = escapeHtml(payload.clientName || 'Cliente')
  const serviceName = escapeHtml(payload.serviceName || 'serviço')
  const date = escapeHtml(payload.date || '')
  const time = escapeHtml(payload.time || '')
  const isReminder = payload.type === 'reminder'

  const title = isReminder ? 'Lembrete de agendamento' : 'Agendamento recebido'
  const intro = isReminder
    ? 'Este é um lembrete do seu próximo agendamento.'
    : 'Seu agendamento foi recebido com sucesso.'

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
      <h2>${title}</h2>
      <p>Olá, ${clientName}.</p>
      <p>${intro}</p>
      <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:4px 0"><strong>Serviço:</strong> ${serviceName}</p>
        ${date ? `<p style="margin:4px 0"><strong>Data:</strong> ${date}</p>` : ''}
        ${time ? `<p style="margin:4px 0"><strong>Horário:</strong> ${time}</p>` : ''}
      </div>
      <p>Até breve!</p>
      <p style="font-size:12px;color:#64748b">Cleverya</p>
    </div>
  `
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não configurada.')
    }

    const payload = await req.json() as SendEmailPayload

    if (!payload.to) {
      return new Response(JSON.stringify({ error: 'Destinatário não informado.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const subject =
      payload.subject ||
      (payload.type === 'reminder' ? 'Lembrete de agendamento' : 'Confirmação de agendamento')

    const html = payload.html || buildBookingHtml(payload)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Cleverya <nao-responda@cleverya.com>',
        to: payload.to,
        subject,
        html,
      }),
    })

    const data: unknown = await res.json()

    if (!res.ok) {
      console.error('Erro retornado pela Resend:', data)
      return new Response(JSON.stringify({ error: 'Falha ao enviar e-mail.', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

serve(handler)
