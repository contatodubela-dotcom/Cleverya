import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type DeliveryStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ code?: number | string; title?: string; message?: string }>;
};

type WhatsAppChangeValue = {
  metadata?: {
    phone_number_id?: string;
    display_phone_number?: string;
  };
  statuses?: DeliveryStatus[];
  messages?: Array<{ id?: string; from?: string; timestamp?: string; type?: string }>;
};

type WhatsAppWebhookBody = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: WhatsAppChangeValue;
    }>;
  }>;
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} não configurado.`);
  return value;
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

async function verifyMetaSignature(rawBody: string, appSecret: string, header: string | null) {
  if (!header?.startsWith("sha256=")) return false;
  const received = header.slice("sha256=".length).trim().toLowerCase();
  const expected = await hmacHex(appSecret, rawBody);
  return timingSafeEqual(expected, received);
}

function normalizeDeliveryStatus(status?: string):
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | null {
  if (status === "sent") return "sent";
  if (status === "delivered") return "delivered";
  if (status === "read") return "read";
  if (status === "failed") return "failed";
  return null;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expectedToken = getEnv("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && verifyToken === expectedToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Webhook verification failed", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const appSecret = getEnv("META_APP_SECRET");
    const signatureOk = await verifyMetaSignature(
      rawBody,
      appSecret,
      req.headers.get("x-hub-signature-256"),
    );

    if (!signatureOk) {
      return new Response("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody) as WhatsAppWebhookBody;
    if (body.object !== "whatsapp_business_account") {
      return new Response("Ignored", { status: 200 });
    }

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;

        const phoneNumberId = change.value?.metadata?.phone_number_id?.trim();
        if (!phoneNumberId) continue;

        const { data: connection, error: connectionError } = await supabase
          .from("whatsapp_connections")
          .select("business_id")
          .eq("phone_number_id", phoneNumberId)
          .maybeSingle();

        if (connectionError) throw connectionError;
        if (!connection?.business_id) continue;

        await supabase
          .from("whatsapp_connections")
          .update({
            last_webhook_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("business_id", connection.business_id);

        for (const delivery of change.value?.statuses || []) {
          const providerMessageId = delivery.id?.trim();
          const eventType = normalizeDeliveryStatus(delivery.status);
          if (!providerMessageId || !eventType) continue;

          const { data: outbox, error: outboxError } = await supabase
            .from("whatsapp_outbox")
            .select("id")
            .eq("business_id", connection.business_id)
            .eq("provider_message_id", providerMessageId)
            .maybeSingle();

          if (outboxError) throw outboxError;

          const providerTimestamp = delivery.timestamp
            ? new Date(Number(delivery.timestamp) * 1000)
            : null;

          const firstError = delivery.errors?.[0];
          const dedupeKey =
            `${providerMessageId}:${eventType}:${delivery.timestamp || "na"}`;

          const { error: eventError } = await supabase
            .from("whatsapp_delivery_events")
            .upsert(
              {
                business_id: connection.business_id,
                outbox_id: outbox?.id || null,
                provider_message_id: providerMessageId,
                dedupe_key: dedupeKey,
                event_type: eventType,
                event_at:
                  providerTimestamp && Number.isFinite(providerTimestamp.getTime())
                    ? providerTimestamp.toISOString()
                    : null,
                error_code:
                  firstError?.code === undefined ? null : String(firstError.code),
                error_message:
                  firstError?.message || firstError?.title || null,
                provider_payload: delivery,
              },
              { onConflict: "dedupe_key", ignoreDuplicates: true },
            );

          if (eventError) throw eventError;

          if (outbox?.id && eventType === "failed") {
            await supabase
              .from("whatsapp_outbox")
              .update({
                status: "failed",
                last_error_code:
                  firstError?.code === undefined ? null : String(firstError.code),
                last_error: firstError?.message || firstError?.title || "Meta delivery failed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", outbox.id);
          }
        }

        // WA1A: mensagens recebidas ainda nao geram resposta automatica.
        // WA2 tratara intents como cancelar/remarcar/meu horario.
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error: unknown) {
    console.error(
      "whatsapp-webhook:",
      error instanceof Error ? error.message : "Erro inesperado",
    );
    return new Response("Internal error", { status: 500 });
  }
});
