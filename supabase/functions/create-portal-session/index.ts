// deno-lint-ignore-file no-import-prefix no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// MUDANÇA AQUI: Usando NPM nativo para evitar erros de polyfill do Deno
import Stripe from 'npm:stripe@^14.21.0'

console.log("🚀 Create Portal Session: Iniciando...")

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar Chave Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
        console.error("❌ FATAL: STRIPE_SECRET_KEY não encontrada.");
        throw new Error('Configuração de servidor incompleta (Missing Secret).');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // 2. Cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 3. Pegar Usuário
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Usuário não autenticado no Supabase.');

    // 4. Buscar ou Criar Customer no Stripe
    let customerId;
    const searchResult = await stripe.customers.list({ email: user.email, limit: 1 });

    if (searchResult.data.length > 0) {
      customerId = searchResult.data[0].id;
      // console.log(`✅ Cliente existente: ${customerId}`);
    } else {
      console.log(`🆕 Criando novo cliente Stripe para: ${user.email}`);
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id }
      });
      customerId = newCustomer.id;
    }

    // 5. Atualizar Banco (Safety check)
    await supabaseClient
      .from('businesses')
      .update({ stripe_customer_id: customerId })
      .eq('owner_id', user.id);

    // 6. Definir URL de Retorno
    const origin = req.headers.get('origin');
    const returnUrl = (origin && origin.startsWith('http')) 
      ? `${origin}/dashboard` 
      : 'https://www.cleverya.com/dashboard';

    // 7. Criar Sessão do Portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ ERRO FATAL NA FUNÇÃO:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})