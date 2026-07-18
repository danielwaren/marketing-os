import {
  fetchAccountProfile,
  fetchTotalValueMetric,
  getConnection,
  restHeaders,
  SUPABASE_URL,
} from "../_shared/instagram.ts";

declare const Deno: {
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
  body: Record<string, unknown>,
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
    ) as { role?: unknown; sub?: unknown };

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

async function ownsWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/workspaces`
  );

  url.searchParams.set("id", `eq.${workspaceId}`);
  url.searchParams.set("owner_id", `eq.${userId}`);
  url.searchParams.set("select", "id");

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows = await response.json() as Array<{
    id: string;
  }>;

  return Boolean(rows[0]);
}

const DAY_SECONDS = 24 * 60 * 60;
const WINDOW_DAYS = 30;

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

  let payload: { workspaceId?: unknown };

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: "El cuerpo de la solicitud no es válido." },
      400
    );
  }

  if (typeof payload.workspaceId !== "string") {
    return jsonResponse(
      { error: "Los datos enviados están incompletos." },
      400
    );
  }

  const owns = await ownsWorkspace(
    payload.workspaceId,
    userId
  );

  if (!owns) {
    return jsonResponse(
      { error: "El workspace no existe o no te pertenece." },
      404
    );
  }

  const connection = await getConnection(
    payload.workspaceId
  );

  if (!connection) {
    return jsonResponse(
      {
        error:
          "Conecta una cuenta de Instagram para ver sus estadísticas.",
        code: "not_connected",
      },
      409
    );
  }

  try {
    const untilUnix = Math.floor(Date.now() / 1000);
    const sinceUnix =
      untilUnix - WINDOW_DAYS * DAY_SECONDS;

    const profile = await fetchAccountProfile(
      connection.ig_user_id,
      connection.access_token
    );

    const [reach, profileViews] = await Promise.all([
      fetchTotalValueMetric({
        igUserId: connection.ig_user_id,
        accessToken: connection.access_token,
        metric: "reach",
        sinceUnix,
        untilUnix,
      }),
      fetchTotalValueMetric({
        igUserId: connection.ig_user_id,
        accessToken: connection.access_token,
        metric: "profile_views",
        sinceUnix,
        untilUnix,
      }),
    ]);

    return jsonResponse({
      username: profile.username,
      followersCount: profile.followersCount,
      mediaCount: profile.mediaCount,
      profilePictureUrl: profile.profilePictureUrl,
      periodDays: WINDOW_DAYS,
      reach,
      profileViews,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible obtener las estadísticas.",
        code: "insights_error",
      },
      502
    );
  }
});
