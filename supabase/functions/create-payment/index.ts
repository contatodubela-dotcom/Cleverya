import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type CreatePaymentPayload = {
  appointment_id?: string;
};

type MercadoPagoPreference = {
  id?: string;
  init_point?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as CreatePaymentPayload;
    const appointmentId = payload.appointment_id?.trim();

    if (!appointmentId) {
      throw new Error("appointment_id é obrigatório.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração interna do Supabase ausente.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, business_id, client_id, service_id, professional_id, status, mp_payment_id")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    if (appointment.status !== "pending_payment") {
      throw new Error("Este agendamento não está aguardando pagamento.");
    }

    if (appointment.mp_payment_id) {
      throw new Error("Este agendamento já possui um pagamento associado.");
    }

    const [
      { data: business, error: businessError },
      { data: service, error: serviceError },
      { data: client, error: clientError },
      { data: professional, error: professionalError },
      { data: credentials, error: credentialsError },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, slug")
        .eq("id", appointment.business_id)
        .single(),
      supabase
        .from("services")
        .select("id, business_id, name, price, require_deposit, is_active")
        .eq("id", appointment.service_id)
        .single(),
      supabase
        .from("clients")
        .select("id, business_id, name, email")
        .eq("id", appointment.client_id)
        .single(),
      supabase
        .from("professionals")
        .select("id, business_id")
        .eq("id", appointment.professional_id)
        .single(),
      supabase
        .from("business_payment_credentials")
        .select("mp_access_token")
        .eq("business_id", appointment.business_id)
        .single(),
    ]);

    if (businessError || !business) throw new Error("Empresa não encontrada.");
    if (serviceError || !service) throw new Error("Serviço não encontrado.");
    if (clientError || !client) throw new Error("Cliente não encontrado.");
    if (professionalError || !professional) throw new Error("Profissional não encontrado.");
    if (credentialsError || !credentials?.mp_access_token) {
      throw new Error("Mercado Pago não está configurado para esta empresa.");
    }

    if (
      service.business_id !== appointment.business_id ||
      client.business_id !== appointment.business_id ||
      professional.business_id !== appointment.business_id
    ) {
      throw new Error("Dados do agendamento não pertencem à mesma empresa.");
    }

    if (!service.is_active || !service.require_deposit) {
      throw new Error("Este serviço não exige sinal.");
    }

    const price = Number(service.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Preço do serviço inválido.");
    }

    const depositValue = Number((price / 2).toFixed(2));
    const webhookUrl =
      `${supabaseUrl}/functions/v1/mp-webhook?app_id=${encodeURIComponent(appointment.id)}`;

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.mp_access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title: `Sinal (50%) - ${service.name}`,
              description: "Agendamento na plataforma Cleverya",
              quantity: 1,
              currency_id: "BRL",
              unit_price: depositValue,
            },
          ],
          payer: {
            name: client.name,
            email: client.email || "sem-email@cleverya.com",
          },
          external_reference: appointment.id,
          notification_url: webhookUrl,
          back_urls: {
            success: `https://www.cleverya.com/${business.slug}?success=true`,
            failure: `https://www.cleverya.com/${business.slug}`,
            pending: `https://www.cleverya.com/${business.slug}`,
          },
          auto_return: "approved",
        }),
      },
    );

    const mpData = (await mpResponse.json()) as MercadoPagoPreference;

    if (!mpResponse.ok || !mpData?.id || !mpData?.init_point) {
      console.error("Mercado Pago recusou a criação da preferência:", mpData);
      throw new Error("Erro ao gerar o link de pagamento.");
    }

    const { data: snapshot, error: snapshotError } = await supabase
      .from("appointments")
      .update({
        deposit_expected_amount: depositValue,
        payment_currency: "BRL",
        mp_preference_id: String(mpData.id),
      })
      .eq("id", appointment.id)
      .eq("status", "pending_payment")
      .is("mp_payment_id", null)
      .select("id")
      .maybeSingle();

    if (snapshotError || !snapshot) {
      console.error("Falha ao persistir snapshot do pagamento:", snapshotError);
      throw new Error("Não foi possível preparar o pagamento com segurança.");
    }

    return new Response(
      JSON.stringify({ init_point: mpData.init_point }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (error: unknown) {
    console.error("create-payment:", errorMessage(error));
    return new Response(
      JSON.stringify({ error: errorMessage(error) }),
      { headers: corsHeaders, status: 400 },
    );
  }
});
