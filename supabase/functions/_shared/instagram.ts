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

export interface AccountProfile {
  username: string | null;
  followersCount: number | null;
  mediaCount: number | null;
  profilePictureUrl: string | null;
}

export async function fetchAccountProfile(
  igUserId: string,
  accessToken: string
): Promise<AccountProfile> {
  const url = new URL(`${GRAPH_BASE}/${igUserId}`);

  url.searchParams.set(
    "fields",
    "username,followers_count,media_count,profile_picture_url"
  );
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const data = await response.json() as {
    username?: string;
    followers_count?: number;
    media_count?: number;
    profile_picture_url?: string;
  };

  if (!response.ok) {
    throw new Error(
      "Instagram no devolvió los datos del perfil."
    );
  }

  return {
    username: data.username ?? null,
    followersCount: data.followers_count ?? null,
    mediaCount: data.media_count ?? null,
    profilePictureUrl: data.profile_picture_url ?? null,
  };
}

// Suma agregada de una métrica de cuenta durante un rango de días.
// Devuelve null si Instagram no entrega el dato para no romper el panel.
export async function fetchTotalValueMetric(options: {
  igUserId: string;
  accessToken: string;
  metric: string;
  sinceUnix: number;
  untilUnix: number;
}): Promise<number | null> {
  const url = new URL(
    `${GRAPH_BASE}/${options.igUserId}/insights`
  );

  url.searchParams.set("metric", options.metric);
  url.searchParams.set("period", "day");
  url.searchParams.set("metric_type", "total_value");
  url.searchParams.set(
    "since",
    String(options.sinceUnix)
  );
  url.searchParams.set(
    "until",
    String(options.untilUnix)
  );
  url.searchParams.set(
    "access_token",
    options.accessToken
  );

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      data?: Array<{
        total_value?: { value?: number };
        values?: Array<{ value?: number }>;
      }>;
    };

    const entry = data.data?.[0];

    if (typeof entry?.total_value?.value === "number") {
      return entry.total_value.value;
    }

    if (Array.isArray(entry?.values)) {
      return entry.values.reduce(
        (sum, item) => sum + (item.value ?? 0),
        0
      );
    }

    return null;
  } catch {
    return null;
  }
}

export interface ReachByFollowType {
  follower: number | null;
  nonFollower: number | null;
  unknown: number | null;
}

// Desglosa el alcance según si la cuenta que vio el contenido sigue
// o no al negocio. Devuelve null por categoría si Instagram no la reporta.
export async function fetchReachByFollowType(options: {
  igUserId: string;
  accessToken: string;
  sinceUnix: number;
  untilUnix: number;
}): Promise<ReachByFollowType> {
  const url = new URL(
    `${GRAPH_BASE}/${options.igUserId}/insights`
  );

  url.searchParams.set("metric", "reach");
  url.searchParams.set("period", "day");
  url.searchParams.set("metric_type", "total_value");
  url.searchParams.set("breakdown", "follow_type");
  url.searchParams.set(
    "since",
    String(options.sinceUnix)
  );
  url.searchParams.set(
    "until",
    String(options.untilUnix)
  );
  url.searchParams.set(
    "access_token",
    options.accessToken
  );

  const empty: ReachByFollowType = {
    follower: null,
    nonFollower: null,
    unknown: null,
  };

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return empty;
    }

    const data = await response.json() as {
      data?: Array<{
        total_value?: {
          breakdowns?: Array<{
            results?: Array<{
              dimension_values?: string[];
              value?: number;
            }>;
          }>;
        };
      }>;
    };

    const results =
      data.data?.[0]?.total_value?.breakdowns?.[0]
        ?.results ?? [];

    const byDimension = new Map(
      results.map((result) => [
        result.dimension_values?.[0],
        result.value ?? null,
      ])
    );

    return {
      follower: byDimension.get("FOLLOWER") ?? null,
      nonFollower:
        byDimension.get("NON_FOLLOWER") ?? null,
      unknown: byDimension.get("UNKNOWN") ?? null,
    };
  } catch {
    return empty;
  }
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

export type InstagramMediaType = "feed" | "stories";

export async function publishImagePost(options: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
  mediaType?: InstagramMediaType;
}) {
  const isStory = options.mediaType === "stories";
  const containerParams: Record<string, string> = {
    image_url: options.imageUrl,
    access_token: options.accessToken,
  };

  if (isStory) {
    containerParams.media_type = "STORIES";
  } else {
    containerParams.caption = options.caption;
  }

  const containerId = await graphPost(
    `${options.igUserId}/media`,
    containerParams
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

export async function publishCarousel(options: {
  igUserId: string;
  accessToken: string;
  imageUrls: string[];
  caption: string;
}) {
  const childIds: string[] = [];

  for (const imageUrl of options.imageUrls) {
    const childId = await graphPost(
      `${options.igUserId}/media`,
      {
        image_url: imageUrl,
        is_carousel_item: "true",
        access_token: options.accessToken,
      }
    );

    childIds.push(childId);
  }

  const parentId = await graphPost(
    `${options.igUserId}/media`,
    {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: options.caption,
      access_token: options.accessToken,
    }
  );

  await waitForContainerReady(
    parentId,
    options.accessToken
  );

  return graphPost(
    `${options.igUserId}/media_publish`,
    {
      creation_id: parentId,
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
