import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

type WebhookBody = {
  action?: string;
  type?: string;
  data?: {
    id?: string | number;
  };
};

type MercadoPagoPayment = {
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  external_reference?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

async function verifyWebhookSignature(
  req: Request,
  dataId: string,
  secret: string,
): Promise<boolean> {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  let timestamp = "";
  let receivedHash = "";

  for (const part of xSignature.split(",")) {
    const [rawKey, rawValue] = part.split("=", 2);
    const key = rawKey?.trim();
    const value = rawValue?.trim();

    if (key === "ts") timestamp = value || "";
    if (key === "v1") receivedHash = value || "";
  }

  if (!timestamp || !receivedHash) return false;

  const normalizedId = dataId.toLowerCase();
  const manifest =
    `id:${normalizedId};request-id:${xRequestId};ts:${timestamp};`;

  const expectedHash = await hmacHex(secret, manifest);
  return timingSafeEqual(expectedHash, receivedHash);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rawBody = await req.text();

    let body: WebhookBody = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody) as WebhookBody;
      } catch {
        body = {};
      }
    }

    const action =
      body.action ||
      body.type ||
      url.searchParams.get("topic") ||
      url.searchParams.get("type") ||
      "";

    const queryPaymentId = url.searchParams.get("data.id")?.trim() || "";
    const bodyPaymentId =
      body.data?.id === undefined || body.data?.id === null
        ? ""
        : String(body.data.id).trim();

    if (!action.includes("payment") || !queryPaymentId) {
      return new Response("Ignorado", { headers: corsHeaders, status: 200 });
    }

    if (bodyPaymentId && bodyPaymentId !== queryPaymentId) {
      console.warn("Webhook Mercado Pago rejeitado: data.id divergente.");
      return new Response(
        "Identificador de pagamento divergente",
        { headers: corsHeaders, status: 401 },
      );
    }

    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("MP_WEBHOOK_SECRET não configurado.");
    }

    const signatureOk = await verifyWebhookSignature(
      req,
      queryPaymentId,
      webhookSecret,
    );

    if (!signatureOk) {
      console.warn("Webhook Mercado Pago rejeitado por assinatura inválida.");
      return new Response(
        "Assinatura inválida",
        { headers: corsHeaders, status: 401 },
      );
    }
    const appointmentHint =
      url.searchParams.get("app_id") ||
      url.searchParams.get("external_reference") ||
      "";

    if (!appointmentHint) {
      return new Response("Ignorado", { headers: corsHeaders, status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração interna do Supabase ausente.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        "id, business_id, client_id, service_id, status, appointment_date, appointment_time, deposit_expected_amount, payment_currency, mp_payment_id",
      )
      .eq("id", appointmentHint)
      .single();

    if (appointmentError || !appointment) {
      return new Response(
        "Agendamento não encontrado",
        { headers: corsHeaders, status: 404 },
      );
    }

    if (
      appointment.status === "confirmed" &&
      appointment.mp_payment_id === queryPaymentId
    ) {
      return new Response(
        "Já processado",
        { headers: corsHeaders, status: 200 },
      );
    }

    if (appointment.status !== "pending_payment") {
      return new Response(
        "Status incompatível",
        { headers: corsHeaders, status: 409 },
      );
    }

    const [
      { data: credentials, error: credentialsError },
      { data: service, error: serviceError },
      { data: client, error: clientError },
    ] = await Promise.all([
      supabase
        .from("business_payment_credentials")
        .select("mp_access_token")
        .eq("business_id", appointment.business_id)
        .single(),
      supabase
        .from("services")
        .select("id, business_id, name")
        .eq("id", appointment.service_id)
        .single(),
      supabase
        .from("clients")
        .select("id, business_id, name, email")
        .eq("id", appointment.client_id)
        .single(),
    ]);

    if (credentialsError || !credentials?.mp_access_token) {
      throw new Error("Credencial Mercado Pago não encontrada.");
    }
    if (serviceError || !service) throw new Error("Serviço não encontrado.");
    if (clientError || !client) throw new Error("Cliente não encontrado.");

    if (
      service.business_id !== appointment.business_id ||
      client.business_id !== appointment.business_id
    ) {
      throw new Error("Dados do agendamento não pertencem à mesma empresa.");
    }

    const mpVerify = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(queryPaymentId)}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.mp_access_token}`,
        },
      },
    );

    const mpData = (await mpVerify.json()) as MercadoPagoPayment;

    if (!mpVerify.ok) {
      console.error("Falha ao consultar pagamento Mercado Pago:", mpData);
      throw new Error("Falha ao validar pagamento no Mercado Pago.");
    }

    if (mpData.external_reference !== appointment.id) {
      return new Response(
        "Referência inválida",
        { headers: corsHeaders, status: 401 },
      );
    }

    if (mpData.status !== "approved") {
      return new Response(
        "Pagamento ainda não aprovado",
        { headers: corsHeaders, status: 200 },
      );
    }

    const expectedAmount = Number(appointment.deposit_expected_amount);
    const amountPaid = Number(mpData.transaction_amount);
    const expectedCurrency = appointment.payment_currency || "BRL";

    if (
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0 ||
      !Number.isFinite(amountPaid) ||
      Math.abs(amountPaid - expectedAmount) > 0.009 ||
      mpData.currency_id !== expectedCurrency
    ) {
      console.error("Pagamento aprovado com dados incompatíveis:", {
        appointmentId: appointment.id,
        expectedAmount,
        amountPaid,
        expectedCurrency,
        currency: mpData.currency_id,
      });

      return new Response(
        "Pagamento incompatível com o agendamento",
        { headers: corsHeaders, status: 409 },
      );
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        deposit_paid: amountPaid,
        mp_payment_id: queryPaymentId,
      })
      .eq("id", appointment.id)
      .eq("status", "pending_payment")
      .is("mp_payment_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedAppointment) {
      const { data: currentAppointment, error: currentAppointmentError } =
        await supabase
          .from("appointments")
          .select("status, mp_payment_id")
          .eq("id", appointment.id)
          .single();

      if (currentAppointmentError) throw currentAppointmentError;

      if (
        currentAppointment?.status === "confirmed" &&
        currentAppointment?.mp_payment_id === queryPaymentId
      ) {
        return new Response(
          "Já processado",
          { headers: corsHeaders, status: 200 },
        );
      }

      return new Response(
        "Conflito de processamento",
        { headers: corsHeaders, status: 409 },
      );
    }

    if (client.email) {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          to: client.email,
          subject: "Pagamento Confirmado - Horário Garantido!",
          clientName: client.name,
          serviceName: service.name,
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          type: "confirmation",
        }),
      });

      if (!emailResponse.ok) {
        console.error(
          "Falha ao enviar e-mail após pagamento:",
          await emailResponse.text(),
        );
      }
    }

    return new Response("OK", { headers: corsHeaders, status: 200 });
  } catch (error: unknown) {
    console.error("mp-webhook:", errorMessage(error));
    return new Response(
      "Erro",
      { headers: corsHeaders, status: 500 },
    );
  }
});
