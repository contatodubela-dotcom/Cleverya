// supabase/functions/send-reminders/index.ts
// deno-lint-ignore-file no-import-prefix
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (req: Request) => Promise<Response> | Response): void
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderClient {
  name: string | null
  phone: string | null
  email: string | null
}

interface ReminderService {
  name: string | null
}

interface ReminderAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  clients: ReminderClient[] | null
  services: ReminderService[] | null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido'
}

function firstRelation<T>(value: T[] | T | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuração do Supabase incompleta.')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const targetDate = tomorrow.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        clients (name, phone, email),
        services (name)
      `)
      .eq('appointment_date', targetDate)
      .eq('status', 'confirmed')
      .order('appointment_time', { ascending: true })

    if (error) throw error

    const appointments = (data || []) as unknown as ReminderAppointment[]

    console.log(`Encontrados ${appointments.length} agendamentos para lembrar em ${targetDate}.`)

    const results: Array<{
      id: string
      status: string
      recipient: string | null
      message: string
    }> = []

    for (const appointment of appointments) {
      const client = firstRelation(appointment.clients)
      const service = firstRelation(appointment.services)

      const firstName = client?.name?.trim().split(/\s+/)[0] || 'Cliente'
      const serviceName = service?.name || 'seu serviço'
      const time = appointment.appointment_time?.slice(0, 5) || ''

      const message =
        `Oi ${firstName}! ✨ Passando para lembrar do seu agendamento amanhã às ${time} ` +
        `para ${serviceName}. Até lá!`

      // IMPORTANTE: ainda é simulação. A integração real com WhatsApp deve ser
      // feita através de um provedor autorizado antes do lançamento comercial.
      console.log(`[SIMULAÇÃO WHATSAPP] Para: ${client?.phone || 'sem telefone'} | Msg: ${message}`)

      results.push({
        id: appointment.id,
        status: 'simulated',
        recipient: client?.phone || null,
        message,
      })
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
