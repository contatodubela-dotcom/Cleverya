import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type OutboxRow = {
  id: string;
  business_id: string;
  recipient_phone: string;
  template_name: string;
  template_language: string;
  template_params: unknown;
  attempts: number;
  max_attempts: number;
  claim_token: string;
};

type MetaSendResponse = {
  messages?: Array<{ id?: string }>;
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
};

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} não configurado.`);
  return value;
}

function normalizePhone(value: string): string {
  let phone = value.replace(/\D/g, "");
  if (phone.startsWith("0")) phone = phone.slice(1);
  if (phone.length <= 11) phone = `55${phone}`;
  return phone;
}

function buildComponents(templateParams: unknown) {
  if (!templateParams || typeof templateParams !== "object") return undefined;
  const body = (templateParams as { body?: unknown }).body;
  if (!Array.isArray(body) || body.length === 0) return undefined;

  return [
    {
      type: "body",
      parameters: body.map((value) => ({
        type: "text",
        text: String(value ?? ""),
      })),
    },
  ];
}

function nextRetryIso(attempts: number): string {
  const minutes = Math.min(60, Math.max(1, 2 ** Math.max(0, attempts - 1)));
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const dispatchSecret = getEnv("WHATSAPP_DISPATCH_SECRET");
    const receivedSecret = req.headers.get("x-cleverya-dispatch-secret");

    if (!receivedSecret || receivedSecret !== dispatchSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const graphVersion = getEnv("META_GRAPH_API_VERSION");

    const { data: claimed, error: claimError } = await supabase
      .rpc("claim_whatsapp_outbox", { p_limit: 20 });

    if (claimError) throw claimError;

    const rows = (claimed || []) as OutboxRow[];
    const results: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      try {
        const [{ data: connection, error: connectionError }, { data: credential, error: credentialError }] =
          await Promise.all([
            supabase
              .from("whatsapp_connections")
              .select("phone_number_id, status")
              .eq("business_id", row.business_id)
              .single(),
            supabase
              .from("whatsapp_credentials")
              .select("access_token, token_expires_at")
              .eq("business_id", row.business_id)
              .single(),
          ]);

        if (connectionError || !connection) throw new Error("WHATSAPP_CONNECTION_NOT_FOUND");
        if (credentialError || !credential?.access_token) throw new Error("WHATSAPP_CREDENTIAL_NOT_FOUND");
        if (connection.status !== "active") throw new Error("WHATSAPP_CONNECTION_NOT_ACTIVE");

        if (
          credential.token_expires_at &&
          new Date(credential.token_expires_at).getTime() <= Date.now()
        ) {
          throw new Error("WHATSAPP_TOKEN_EXPIRED");
        }

        const components = buildComponents(row.template_params);
        const payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: normalizePhone(row.recipient_phone),
          type: "template",
          template: {
            name: row.template_name,
            language: { code: row.template_language },
            ...(components ? { components } : {}),
          },
        };

        const response = await fetch(
          `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(connection.phone_number_id)}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credential.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        const metaData = (await response.json()) as MetaSendResponse;
        const providerMessageId = metaData.messages?.[0]?.id;

        if (!response.ok || !providerMessageId) {
          const message =
            metaData.error?.message || `Meta HTTP ${response.status}`;
          const code =
            metaData.error?.code === undefined ? null : String(metaData.error.code);

          const finalFailure = row.attempts >= row.max_attempts;

          await supabase
            .from("whatsapp_outbox")
            .update({
              status: "failed",
              claim_token: null,
              claimed_at: null,
              next_attempt_at: finalFailure
                ? new Date("9999-12-31T23:59:59Z").toISOString()
                : nextRetryIso(row.attempts),
              last_error_code: code,
              last_error: message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .eq("claim_token", row.claim_token);

          results.push({ id: row.id, sent: false, error: message });
          continue;
        }

        const now = new Date().toISOString();

        const { error: sentError } = await supabase
          .from("whatsapp_outbox")
          .update({
            status: "sent",
            provider_message_id: providerMessageId,
            sent_at: now,
            claim_token: null,
            claimed_at: null,
            last_error_code: null,
            last_error: null,
            updated_at: now,
          })
          .eq("id", row.id)
          .eq("claim_token", row.claim_token);

        if (sentError) throw sentError;

        await supabase
          .from("whatsapp_delivery_events")
          .upsert(
            {
              business_id: row.business_id,
              outbox_id: row.id,
              provider_message_id: providerMessageId,
              dedupe_key: `${providerMessageId}:accepted:dispatch`,
              event_type: "accepted",
              event_at: now,
              provider_payload: metaData,
            },
            { onConflict: "dedupe_key", ignoreDuplicates: true },
          );

        results.push({ id: row.id, sent: true, provider_message_id: providerMessageId });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro inesperado";
        const finalFailure = row.attempts >= row.max_attempts;

        await supabase
          .from("whatsapp_outbox")
          .update({
            status: "failed",
            claim_token: null,
            claimed_at: null,
            next_attempt_at: finalFailure
              ? new Date("9999-12-31T23:59:59Z").toISOString()
              : nextRetryIso(row.attempts),
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("claim_token", row.claim_token);

        results.push({ id: row.id, sent: false, error: message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, claimed: rows.length, results }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    console.error("whatsapp-dispatch:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
});
