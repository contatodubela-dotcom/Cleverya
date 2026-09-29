import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type StatePayload = {
  business_id: string;
  user_id: string;
  exp: number;
  nonce: string;
};

type MercadoPagoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  public_key?: string;
  user_id?: number | string;
  [key: string]: unknown;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function base64UrlToText(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  try {
    if (!code || !state) {
      throw new Error("Faltando code ou state na URL.");
    }

    const clientId = Deno.env.get("MP_CLIENT_ID");
    const clientSecret = Deno.env.get("MP_CLIENT_SECRET");
    const stateSecret = Deno.env.get("MP_OAUTH_STATE_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !clientId ||
      !clientSecret ||
      !stateSecret ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      throw new Error("Segredos obrigatórios não configurados.");
    }

    const [payloadEncoded, receivedSignature] = state.split(".");
    if (!payloadEncoded || !receivedSignature) {
      throw new Error("State OAuth inválido.");
    }

    const expectedSignature = await hmacHex(stateSecret, payloadEncoded);
    if (!timingSafeEqual(expectedSignature, receivedSignature)) {
      throw new Error("Assinatura do state OAuth inválida.");
    }

    const statePayload = JSON.parse(
      base64UrlToText(payloadEncoded),
    ) as StatePayload;

    if (
      !statePayload.business_id ||
      !statePayload.user_id ||
      !statePayload.exp ||
      statePayload.exp < Math.floor(Date.now() / 1000)
    ) {
      throw new Error("State OAuth expirado ou inválido.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", statePayload.business_id)
      .eq("owner_id", statePayload.user_id)
      .single();

    if (businessError || !business) {
      throw new Error("Empresa do OAuth não corresponde ao proprietário.");
    }

    const redirectUri =
      Deno.env.get("MP_REDIRECT_URI") ||
      `${supabaseUrl}/functions/v1/mp-auth-callback`;

    const tokenResponse = await fetch(
      "https://api.mercadopago.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    const tokenData =
      (await tokenResponse.json()) as MercadoPagoTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Mercado Pago recusou OAuth:", tokenData);
      throw new Error("O Mercado Pago recusou a troca do token.");
    }

    const { error: saveError } = await supabase
      .from("business_payment_credentials")
      .upsert(
        {
          business_id: business.id,
          mp_access_token: tokenData.access_token,
          mp_refresh_token: tokenData.refresh_token || null,
          mp_public_key: tokenData.public_key || null,
          mp_user_id: tokenData.user_id ? String(tokenData.user_id) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      );

    if (saveError) throw saveError;

    const appUrl = Deno.env.get("CLEVERYA_APP_URL") ||
      "https://www.cleverya.com";

    return Response.redirect(
      `${appUrl}/dashboard?mp_success=true`,
      302,
    );
  } catch (error: unknown) {
    console.error("mp-auth-callback:", error);

    const appUrl = Deno.env.get("CLEVERYA_APP_URL") ||
      "https://www.cleverya.com";
    const message = encodeURIComponent(errorMessage(error));

    return Response.redirect(
      `${appUrl}/dashboard?mp_error=${message}`,
      302,
    );
  }
});
