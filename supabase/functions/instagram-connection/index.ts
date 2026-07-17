import {
  INSTAGRAM_APP_ID,
} from "../../../src/features/instagram/constants/instagram.constants.ts";
import type {
  InstagramConnectionInput,
  InstagramConnectionStatus,
} from "../../../src/features/instagram/types/instagram.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(
    handler: (
      request: Request
    ) => Response | Promise<Response>
  ): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(
  body: Record<string, unknown> | InstagramConnectionStatus,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getAuthenticatedUserId(
  request: Request
): string | null {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7);
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        Math.ceil(payload.length / 4) * 4,
        "="
      );
    const claims = JSON.parse(
      atob(normalized)
    ) as {
      role?: unknown;
      sub?: unknown;
    };

    if (
      claims.role === "authenticated" &&
      typeof claims.sub === "string" &&
      claims.sub.length > 0
    ) {
      return claims.sub;
    }

    return null;
  } catch {
    return null;
  }
}

function isValidPayload(
  value: unknown
): value is InstagramConnectionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload =
    value as Partial<InstagramConnectionInput>;

  if (
    !["status", "connect", "disconnect"].includes(
      payload.action ?? ""
    )
  ) {
    return false;
  }

  if (
    typeof payload.workspaceId !== "string" ||
    payload.workspaceId.length === 0
  ) {
    return false;
  }

  if (payload.action === "connect") {
    return (
      typeof payload.code === "string" &&
      payload.code.length > 0 &&
      typeof payload.redirectUri === "string" &&
      payload.redirectUri.length > 0
    );
  }

  return true;
}

interface InstagramConnectionRow {
  ig_username: string;
  ig_user_id: string;
  connected_at: string;
  token_expires_at: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function restHeaders(
  extra: Record<string, string> = {}
) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function findOwnedWorkspace(
  workspaceId: string,
  userId: string
) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/workspaces`
  );

  url.searchParams.set("id", `eq.${workspaceId}`);
  url.searchParams.set(
    "owner_id",
    `eq.${userId}`
  );
  url.searchParams.set("select", "id");

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows =
    await response.json() as Array<{ id: string }>;

  return rows[0] ?? null;
}

async function getConnectionRow(
  workspaceId: string
) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/instagram_connections`
  );

  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );
  url.searchParams.set(
    "select",
    "ig_username,ig_user_id,connected_at,token_expires_at"
  );

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows =
    await response.json() as InstagramConnectionRow[];

  return rows[0] ?? null;
}

async function deleteConnection(
  workspaceId: string
) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/instagram_connections`
  );

  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );

  await fetch(url, {
    method: "DELETE",
    headers: restHeaders(),
  });
}

async function upsertConnection(row: {
  workspace_id: string;
  ig_user_id: string;
  ig_username: string;
  access_token: string;
  token_expires_at: string;
}) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/instagram_connections`
  );

  url.searchParams.set("on_conflict", "workspace_id");

  const response = await fetch(url, {
    method: "POST",
    headers: restHeaders({
      Prefer:
        "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({
      ...row,
      updated_at: new Date().toISOString(),
    }),
  });
  const rows =
    await response.json() as InstagramConnectionRow[];

  if (!response.ok || !rows[0]) {
    throw new Error(
      "No fue posible guardar la conexión."
    );
  }

  return rows[0];
}

function toStatus(
  row: InstagramConnectionRow | null
): InstagramConnectionStatus {
  if (!row) {
    return {
      connected: false,
      igUsername: null,
      igUserId: null,
      connectedAt: null,
      tokenExpiresAt: null,
    };
  }

  return {
    connected: true,
    igUsername: row.ig_username,
    igUserId: row.ig_user_id,
    connectedAt: row.connected_at,
    tokenExpiresAt: row.token_expires_at,
  };
}

interface ShortLivedTokenResponse {
  access_token?: string;
  error_message?: string;
}

interface LongLivedTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface ProfileResponse {
  username?: string;
  user_id?: string;
}

async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri: string,
  appSecret: string
) {
  const body = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const response = await fetch(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body }
  );
  const data =
    await response.json() as ShortLivedTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_message ||
        "No fue posible intercambiar el código con Instagram."
    );
  }

  return data.access_token;
}

async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appSecret: string
) {
  const url = new URL(
    "https://graph.instagram.com/access_token"
  );

  url.searchParams.set(
    "grant_type",
    "ig_exchange_token"
  );
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set(
    "access_token",
    shortLivedToken
  );

  const response = await fetch(url);
  const data =
    await response.json() as LongLivedTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      "No fue posible generar el token de larga duración."
    );
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 5_184_000,
  };
}

async function fetchInstagramProfile(
  accessToken: string
) {
  const url = new URL(
    "https://graph.instagram.com/v21.0/me"
  );

  url.searchParams.set(
    "fields",
    "user_id,username"
  );
  url.searchParams.set(
    "access_token",
    accessToken
  );

  const response = await fetch(url);
  const data =
    await response.json() as ProfileResponse;

  if (!response.ok || !data.username) {
    throw new Error(
      "No fue posible obtener el perfil de Instagram."
    );
  }

  return {
    username: data.username,
    userId: data.user_id ?? "",
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Método no permitido." },
      405
    );
  }

  const userId = getAuthenticatedUserId(request);

  if (!userId) {
    return jsonResponse(
      { error: "Sesión requerida." },
      401
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        error:
          "El cuerpo de la solicitud no es válido.",
        code: "invalid_response",
      },
      400
    );
  }

  if (!isValidPayload(payload)) {
    return jsonResponse(
      {
        error:
          "Los datos enviados están incompletos.",
        code: "invalid_response",
      },
      400
    );
  }

  const workspace = await findOwnedWorkspace(
    payload.workspaceId,
    userId
  );

  if (!workspace) {
    return jsonResponse(
      {
        error:
          "El workspace no existe o no te pertenece.",
        code: "workspace_not_found",
      },
      404
    );
  }

  if (payload.action === "status") {
    const row = await getConnectionRow(
      payload.workspaceId
    );

    return jsonResponse(toStatus(row));
  }

  if (payload.action === "disconnect") {
    await deleteConnection(payload.workspaceId);

    return jsonResponse(toStatus(null));
  }

  const appSecret =
    Deno.env.get("INSTAGRAM_APP_SECRET")?.trim() ??
    "";

  if (!appSecret) {
    return jsonResponse(
      {
        error:
          "Instagram no está configurado en el servidor.",
        code: "not_configured",
      },
      500
    );
  }

  try {
    const shortLivedToken =
      await exchangeCodeForShortLivedToken(
        payload.code as string,
        payload.redirectUri as string,
        appSecret
      );
    const { accessToken, expiresIn } =
      await exchangeForLongLivedToken(
        shortLivedToken,
        appSecret
      );
    const profile = await fetchInstagramProfile(
      accessToken
    );
    const expiresAt = new Date(
      Date.now() + expiresIn * 1000
    ).toISOString();

    const row = await upsertConnection({
      workspace_id: payload.workspaceId,
      ig_user_id: profile.userId,
      ig_username: profile.username,
      access_token: accessToken,
      token_expires_at: expiresAt,
    });

    return jsonResponse(toStatus(row));
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al conectar con Instagram.",
        code: "oauth_error",
      },
      502
    );
  }
});
