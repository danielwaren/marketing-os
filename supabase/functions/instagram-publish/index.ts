import {
  createSignedImageUrl,
  fetchPermalink,
  getConnection,
  markPostPublished,
  publishCarousel,
  publishImagePost,
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

async function getOrderedImagePaths(
  mediaIds: string[],
  workspaceId: string
): Promise<string[] | null> {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/media`
  );

  url.searchParams.set(
    "id",
    `in.(${mediaIds.join(",")})`
  );
  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );
  url.searchParams.set("file_type", "eq.image");
  url.searchParams.set(
    "select",
    "id,file_path"
  );

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows =
    await response.json() as Array<{
      id: string;
      file_path: string;
    }>;

  const byId = new Map(
    rows.map((row) => [row.id, row.file_path])
  );

  const ordered = mediaIds.map((id) =>
    byId.get(id)
  );

  if (ordered.some((path) => !path)) {
    return null;
  }

  return ordered as string[];
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
    mediaType?: unknown;
    mediaIds?: unknown;
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

  const mediaType =
    payload.mediaType === "stories"
      ? "stories"
      : payload.mediaType === "carousel"
        ? "carousel"
        : "feed";

  const mediaIds = Array.isArray(payload.mediaIds)
    ? payload.mediaIds.filter(
        (id): id is string => typeof id === "string"
      )
    : [];

  if (
    mediaType === "carousel" &&
    (mediaIds.length < 2 || mediaIds.length > 10)
  ) {
    return jsonResponse(
      {
        error:
          "Un carrusel necesita entre 2 y 10 imágenes.",
      },
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
    let mediaId: string;

    if (mediaType === "carousel") {
      const paths = await getOrderedImagePaths(
        mediaIds,
        payload.workspaceId
      );

      if (!paths) {
        return jsonResponse(
          {
            error:
              "Alguna imagen del carrusel no existe o no te pertenece.",
          },
          400
        );
      }

      const imageUrls = await Promise.all(
        paths.map((path) =>
          createSignedImageUrl(path)
        )
      );

      mediaId = await publishCarousel({
        igUserId: connection.ig_user_id,
        accessToken: connection.access_token,
        imageUrls,
        caption: post.content,
      });

      await markPostPublished(post.id);
    } else {
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

      const imageUrl = await createSignedImageUrl(
        filePath
      );

      mediaId = await publishImagePost({
        igUserId: connection.ig_user_id,
        accessToken: connection.access_token,
        imageUrl,
        caption: post.content,
        mediaType,
      });

      // Las historias son efímeras: no cambian el estado del post.
      if (mediaType === "feed") {
        await markPostPublished(post.id);
      }
    }

    const permalink = await fetchPermalink(
      mediaId,
      connection.access_token
    );

    return jsonResponse({
      published: true,
      mediaId,
      mediaType,
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
