import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type AccountAction = "status" | "start" | "disconnect";

type StatePayload = {
  business_id: string;
  user_id: string;
  exp: number;
  nonce: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado.";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Não autenticado." }),
        { headers: corsHeaders, status: 401 },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mpClientId = Deno.env.get("MP_CLIENT_ID");
    const stateSecret = Deno.env.get("MP_OAUTH_STATE_SECRET");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração interna do Supabase ausente.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { headers: corsHeaders, status: 401 },
      );
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("owner_id", authData.user.id)
      .single();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: "Empresa não encontrada." }),
        { headers: corsHeaders, status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: AccountAction;
    };
    const action = body.action;

    if (!action || !["status", "start", "disconnect"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Ação inválida." }),
        { headers: corsHeaders, status: 400 },
      );
    }

    if (action === "status") {
      const { data: credentials } = await supabase
        .from("business_payment_credentials")
        .select("business_id")
        .eq("business_id", business.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ connected: Boolean(credentials) }),
        { headers: corsHeaders, status: 200 },
      );
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("business_payment_credentials")
        .delete()
        .eq("business_id", business.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ connected: false }),
        { headers: corsHeaders, status: 200 },
      );
    }

    if (!mpClientId || !stateSecret) {
      throw new Error(
        "MP_CLIENT_ID ou MP_OAUTH_STATE_SECRET não configurado.",
      );
    }

    const statePayload: StatePayload = {
      business_id: business.id,
      user_id: authData.user.id,
      exp: Math.floor(Date.now() / 1000) + 10 * 60,
      nonce: crypto.randomUUID(),
    };

    const payloadEncoded = textToBase64Url(JSON.stringify(statePayload));
    const signature = await hmacHex(stateSecret, payloadEncoded);
    const state = `${payloadEncoded}.${signature}`;

    const redirectUri =
      Deno.env.get("MP_REDIRECT_URI_V2") ||
      `${supabaseUrl}/functions/v1/mp-auth-callback-v2`;

    const authorizationUrl = new URL(
      "https://auth.mercadopago.com.br/authorization",
    );
    authorizationUrl.search = new URLSearchParams({
      client_id: mpClientId,
      response_type: "code",
      platform_id: "mp",
      state,
      redirect_uri: redirectUri,
    }).toString();

    return new Response(
      JSON.stringify({ authorization_url: authorizationUrl.toString() }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (error: unknown) {
    console.error("mp-account:", error);
    return new Response(
      JSON.stringify({ error: errorMessage(error) }),
      { headers: corsHeaders, status: 500 },
    );
  }
});
