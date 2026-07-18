declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

const GRAPH_BASE =
  "https://graph.instagram.com/v21.0";

export const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "";
export const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function restHeaders(
  extra: Record<string, string> = {}
) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export interface InstagramConnection {
  ig_user_id: string;
  access_token: string;
}

export async function getConnection(
  workspaceId: string
): Promise<InstagramConnection | null> {
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
    await response.json() as InstagramConnection[];

  return rows[0] ?? null;
}

export async function createSignedImageUrl(
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

interface GraphIdResponse {
  id?: string;
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
    await response.json() as GraphIdResponse;

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

export async function fetchPermalink(
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

export async function publishImagePost(options: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}) {
  const containerId = await graphPost(
    `${options.igUserId}/media`,
    {
      image_url: options.imageUrl,
      caption: options.caption,
      access_token: options.accessToken,
    }
  );

  await waitForContainerReady(
    containerId,
    options.accessToken
  );

  return graphPost(
    `${options.igUserId}/media_publish`,
    {
      creation_id: containerId,
      access_token: options.accessToken,
    }
  );
}

export async function markPostPublished(
  postId: string
) {
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
