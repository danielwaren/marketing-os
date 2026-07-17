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

const GRAPH_BASE =
  "https://graph.instagram.com/v21.0";

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

interface PostRow {
  id: string;
  content: string;
  platform: string;
  status: string;
  menu: {
    media: { file_path: string } | null;
  } | null;
}

async function getOwnedPost(
  postId: string,
  workspaceId: string,
  userId: string
) {
  const workspaceUrl = new URL(
    `${SUPABASE_URL}/rest/v1/workspaces`
  );

  workspaceUrl.searchParams.set(
    "id",
    `eq.${workspaceId}`
  );
  workspaceUrl.searchParams.set(
    "owner_id",
    `eq.${userId}`
  );
  workspaceUrl.searchParams.set("select", "id");

  const workspaceResponse = await fetch(workspaceUrl, {
    headers: restHeaders(),
  });
  const workspaces =
    await workspaceResponse.json() as Array<{
      id: string;
    }>;

  if (!workspaces[0]) {
    return null;
  }

  const postUrl = new URL(
    `${SUPABASE_URL}/rest/v1/posts`
  );

  postUrl.searchParams.set("id", `eq.${postId}`);
  postUrl.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );
  postUrl.searchParams.set(
    "select",
    "id,content,platform,status,menu:menu_id(media:media_id(file_path))"
  );

  const postResponse = await fetch(postUrl, {
    headers: restHeaders(),
  });
  const posts =
    await postResponse.json() as PostRow[];

  return posts[0] ?? null;
}

async function getConnection(workspaceId: string) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/instagram_connections`
  );

  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );
  url.searchParams.set(
    "select",
    "ig_user_id,access_token"
  );

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows =
    await response.json() as Array<{
      ig_user_id: string;
      access_token: string;
    }>;

  return rows[0] ?? null;
}

async function createSignedImageUrl(
  filePath: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/media/${filePath}`,
    {
      method: "POST",
      headers: restHeaders(),
      body: JSON.stringify({ expiresIn: 3600 }),
    }
  );
  const data =
    await response.json() as { signedURL?: string };

  if (!response.ok || !data.signedURL) {
    throw new Error(
      "No fue posible generar el enlace de la imagen."
    );
  }

  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

interface GraphError {
  error?: { message?: string };
}

async function graphPost(
  path: string,
  params: Record<string, string>
) {
  const response = await fetch(
    `${GRAPH_BASE}/${path}`,
    {
      method: "POST",
      body: new URLSearchParams(params),
    }
  );
  const data =
    await response.json() as GraphError & {
      id?: string;
    };

  if (!response.ok || !data.id) {
    throw new Error(
      data.error?.message ||
        "Instagram rechazó la solicitud."
    );
  }

  return data.id;
}

async function waitForContainerReady(
  containerId: string,
  accessToken: string
) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const url = new URL(
      `${GRAPH_BASE}/${containerId}`
    );

    url.searchParams.set("fields", "status_code");
    url.searchParams.set(
      "access_token",
      accessToken
    );

    const response = await fetch(url);
    const data =
      await response.json() as {
        status_code?: string;
      };

    if (data.status_code === "FINISHED") {
      return;
    }

    if (
      data.status_code === "ERROR" ||
      data.status_code === "EXPIRED"
    ) {
      throw new Error(
        "Instagram no pudo procesar la imagen."
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );
  }

  throw new Error(
    "La imagen tardó demasiado en procesarse en Instagram."
  );
}

async function fetchPermalink(
  mediaId: string,
  accessToken: string
) {
  const url = new URL(`${GRAPH_BASE}/${mediaId}`);

  url.searchParams.set("fields", "permalink");
  url.searchParams.set(
    "access_token",
    accessToken
  );

  const response = await fetch(url);
  const data =
    await response.json() as { permalink?: string };

  return data.permalink ?? null;
}

async function markPostPublished(postId: string) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/posts`
  );

  url.searchParams.set("id", `eq.${postId}`);

  const now = new Date().toISOString();

  await fetch(url, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      status: "published",
      published_at: now,
      scheduled_at: null,
      updated_at: now,
    }),
  });
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

  let payload: {
    workspaceId?: unknown;
    postId?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: "El cuerpo de la solicitud no es válido." },
      400
    );
  }

  if (
    typeof payload.workspaceId !== "string" ||
    typeof payload.postId !== "string"
  ) {
    return jsonResponse(
      { error: "Los datos enviados están incompletos." },
      400
    );
  }

  const post = await getOwnedPost(
    payload.postId,
    payload.workspaceId,
    userId
  );

  if (!post) {
    return jsonResponse(
      { error: "La publicación no existe o no te pertenece." },
      404
    );
  }

  if (post.platform !== "instagram") {
    return jsonResponse(
      {
        error:
          "Solo se pueden publicar en Instagram las publicaciones de esa plataforma.",
      },
      400
    );
  }

  const filePath = post.menu?.media?.file_path;

  if (!filePath) {
    return jsonResponse(
      {
        error:
          "La publicación necesita una fotografía para publicarse en Instagram.",
      },
      400
    );
  }

  const connection = await getConnection(
    payload.workspaceId
  );

  if (!connection) {
    return jsonResponse(
      {
        error:
          "Conecta una cuenta de Instagram antes de publicar.",
        code: "not_connected",
      },
      409
    );
  }

  try {
    const imageUrl = await createSignedImageUrl(
      filePath
    );
    const containerId = await graphPost(
      `${connection.ig_user_id}/media`,
      {
        image_url: imageUrl,
        caption: post.content,
        access_token: connection.access_token,
      }
    );

    await waitForContainerReady(
      containerId,
      connection.access_token
    );

    const mediaId = await graphPost(
      `${connection.ig_user_id}/media_publish`,
      {
        creation_id: containerId,
        access_token: connection.access_token,
      }
    );

    await markPostPublished(post.id);

    const permalink = await fetchPermalink(
      mediaId,
      connection.access_token
    );

    return jsonResponse({
      published: true,
      mediaId,
      permalink,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "No fue posible publicar en Instagram.",
        code: "publish_error",
      },
      502
    );
  }
});
