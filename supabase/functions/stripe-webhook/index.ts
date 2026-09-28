// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('✅ Stripe Webhook Loaded (NPM Version - Fixed Date & Logic)')

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro desconhecido'
}

serve(async (req: Request) => {
  const signature = req.headers.get('Stripe-Signature')
  
  // Passo 1: Ler o corpo da requisição como texto
  const body = await req.text()

  let event: Stripe.Event
  try {
    // Passo 2: Validar se foi a Stripe mesmo que mandou (Assinatura)
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!
    )
  } catch (err: unknown) {
    const message = getErrorMessage(err)
    console.error(`❌ Webhook signature failed:`, message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  console.log(`🔔 Evento recebido: ${event.type}`)

  try {
    switch (event.type) {
      // CENÁRIO 1: Primeira Compra (Checkout)
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.client_reference_id
        const customerId = session.customer
        
        console.log(`💰 Checkout completado para User: ${userId}, Customer: ${customerId}`)

        if (!userId) {
            console.error("⚠️ checkout.session.completed sem client_reference_id! Ignorando.")
            break;
        }

        const planType = getPlanTypeFromAmount(session.amount_total);
        
        const { error } = await supabase
          .from('businesses')
          .update({ 
              stripe_customer_id: customerId,
              plan_type: planType,
              subscription_status: 'active'
          })
          .eq('owner_id', userId)
        
        if (error) console.error('❌ Erro ao atualizar business:', error)
        else console.log('✅ Business atualizado com sucesso (Checkout)')
        break
      }

      // CENÁRIO 2: Renovação, Atualização ou Cancelamento
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const status = subscription.status
        const customerId = subscription.customer
        
        console.log(`🔄 Atualização de assinatura para Customer: ${customerId}, Status: ${status}`)

        let planType = 'free';
        // Se estiver ativo ou trialing, calcula o plano. Se cancelado, cai para free.
        if (status === 'active' || status === 'trialing') {
             planType = getPlanTypeFromProduct(subscription);
        }

        // --- CORREÇÃO DE DATA (BLINDAGEM CONTRA O ERRO RangeError) ---
        // A lógica é: Tenta pegar o fim do período. Se não tiver (cancelou agora), pega a data de encerramento.
        // Se ainda assim falhar, pega a data de agora do servidor.
        const dateTimestamp = subscription.current_period_end || subscription.ended_at || Math.floor(Date.now() / 1000);
        
        // Converte para ISO String com segurança
        const endDateISO = new Date(dateTimestamp * 1000).toISOString();
        // -------------------------------------------------------------

        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: status,
            plan_type: planType,
            subscription_end_date: endDateISO,
          })
          .eq('stripe_customer_id', customerId)

        if (error) console.error('❌ Erro ao atualizar business (Subscription):', error)
        else console.log('✅ Business atualizado com sucesso (Subscription)')
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💸 Fatura paga: ${invoice.amount_paid} por Customer: ${invoice.customer}`);
        break;
      }
      
      default:
        console.log(`🤷‍♂️ Evento não tratado: ${event.type}`);
    }
  } catch (err: unknown) {
    console.error('❌ Erro CRÍTICO no processamento:', err)
    return new Response('Webhook handler failed inside logic', { status: 400 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// --- FUNÇÕES AUXILIARES ---

function getPlanTypeFromAmount(amount: number | null): string {
    if (!amount) return 'free';
    if (amount >= 5900) return 'business'; 
    if (amount >= 2900) return 'pro';
    return 'free';
}

function getPlanTypeFromProduct(subscription: Stripe.Subscription): string {
  // Tenta pegar do primeiro item da assinatura
  const priceAmount = subscription.items?.data[0]?.price?.unit_amount || 0
  if (priceAmount >= 5900) return 'business'
  if (priceAmount >= 2900) return 'pro'
  return 'free'
}