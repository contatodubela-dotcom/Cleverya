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

type AppointmentRow = {
  id: string;
  business_id: string;
  client_id: string;
  service_id: string;
  professional_id: string;
  status: string;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  payment_checkout_url: string | null;
  payment_expires_at: string | null;
  payment_creation_token: string | null;
  payment_creation_started_at: string | null;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function isExpired(value: string | null): boolean {
  if (!value) return false;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) && parsed <= Date.now();
}

async function releaseClaim(
  supabase: ReturnType<typeof createClient>,
  appointmentId: string,
  claimToken: string,
) {
  await supabase
    .from("appointments")
    .update({
      payment_creation_token: null,
      payment_creation_started_at: null,
    })
    .eq("id", appointmentId)
    .eq("payment_creation_token", claimToken);
}

async function fetchPreferenceInitPoint(
  accessToken: string,
  preferenceId: string,
): Promise<string | null> {
  const response = await fetch(
    `https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preferenceId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as MercadoPagoPreference;
  return data?.init_point || null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let claimToken: string | null = null;
  let claimedAppointmentId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

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

    supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase.rpc("expire_stale_pending_payments");

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        "id, business_id, client_id, service_id, professional_id, status, mp_payment_id, mp_preference_id, payment_checkout_url, payment_expires_at, payment_creation_token, payment_creation_started_at",
      )
      .eq("id", appointmentId)
      .single<AppointmentRow>();

    if (appointmentError || !appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    if (appointment.status === "payment_expired" || isExpired(appointment.payment_expires_at)) {
      throw new Error("PAYMENT_RESERVATION_EXPIRED");
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

    if (appointment.payment_checkout_url && appointment.mp_preference_id) {
      return new Response(
        JSON.stringify({
          init_point: appointment.payment_checkout_url,
          reused: true,
        }),
        { headers: corsHeaders, status: 200 },
      );
    }

    if (appointment.mp_preference_id) {
      const recoveredInitPoint = await fetchPreferenceInitPoint(
        credentials.mp_access_token,
        appointment.mp_preference_id,
      );

      if (recoveredInitPoint) {
        await supabase
          .from("appointments")
          .update({ payment_checkout_url: recoveredInitPoint })
          .eq("id", appointment.id)
          .eq("status", "pending_payment")
          .is("mp_payment_id", null);

        return new Response(
          JSON.stringify({ init_point: recoveredInitPoint, reused: true }),
          { headers: corsHeaders, status: 200 },
        );
      }
    }

    if (
      appointment.payment_creation_token &&
      appointment.payment_creation_started_at &&
      Date.now() - new Date(appointment.payment_creation_started_at).getTime() < 120_000
    ) {
      throw new Error("PAYMENT_CREATION_IN_PROGRESS");
    }

    if (appointment.payment_creation_token) {
      await supabase
        .from("appointments")
        .update({
          payment_creation_token: null,
          payment_creation_started_at: null,
        })
        .eq("id", appointment.id)
        .eq("payment_creation_token", appointment.payment_creation_token);
    }

    claimToken = crypto.randomUUID();
    claimedAppointmentId = appointment.id;

    const { data: claimed, error: claimError } = await supabase
      .from("appointments")
      .update({
        payment_creation_token: claimToken,
        payment_creation_started_at: new Date().toISOString(),
      })
      .eq("id", appointment.id)
      .eq("status", "pending_payment")
      .is("mp_payment_id", null)
      .is("payment_creation_token", null)
      .select("id")
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claimed) {
      const { data: current } = await supabase
        .from("appointments")
        .select("mp_preference_id, payment_checkout_url, status")
        .eq("id", appointment.id)
        .single();

      if (
        current?.status === "pending_payment" &&
        current?.mp_preference_id &&
        current?.payment_checkout_url
      ) {
        return new Response(
          JSON.stringify({ init_point: current.payment_checkout_url, reused: true }),
          { headers: corsHeaders, status: 200 },
        );
      }

      throw new Error("PAYMENT_CREATION_IN_PROGRESS");
    }

    const price = Number(service.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Preço do serviço inválido.");
    }

    const depositValue = Number((price / 2).toFixed(2));
    const webhookUrl =
      `${supabaseUrl}/functions/v1/mp-webhook?app_id=${encodeURIComponent(appointment.id)}`;

    const now = new Date();
    const expiresAt = appointment.payment_expires_at
      ? new Date(appointment.payment_expires_at)
      : new Date(now.getTime() + 30 * 60 * 1000);

    if (expiresAt.getTime() <= now.getTime()) {
      throw new Error("PAYMENT_RESERVATION_EXPIRED");
    }

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
          expires: true,
          expiration_date_from: now.toISOString(),
          expiration_date_to: expiresAt.toISOString(),
          date_of_expiration: expiresAt.toISOString(),
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
        payment_checkout_url: mpData.init_point,
        payment_expires_at: expiresAt.toISOString(),
        payment_creation_token: null,
        payment_creation_started_at: null,
      })
      .eq("id", appointment.id)
      .eq("status", "pending_payment")
      .is("mp_payment_id", null)
      .eq("payment_creation_token", claimToken)
      .select("id")
      .maybeSingle();

    if (snapshotError || !snapshot) {
      console.error("Falha ao persistir snapshot do pagamento:", snapshotError);
      throw new Error("Não foi possível preparar o pagamento com segurança.");
    }

    claimToken = null;
    claimedAppointmentId = null;

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, reused: false }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (error: unknown) {
    if (supabase && claimToken && claimedAppointmentId) {
      await releaseClaim(supabase, claimedAppointmentId, claimToken);
    }

    const message = errorMessage(error);
    console.error("create-payment:", message);

    const status =
      message === "PAYMENT_CREATION_IN_PROGRESS" ? 409 :
      message === "PAYMENT_RESERVATION_EXPIRED" ? 410 :
      400;

    return new Response(
      JSON.stringify({ error: message }),
      { headers: corsHeaders, status },
    );
  }
});
