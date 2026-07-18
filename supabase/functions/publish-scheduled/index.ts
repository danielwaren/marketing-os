import {
  createSignedImageUrl,
  getConnection,
  markPostPublished,
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

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function isValidCronSecret(
  candidate: string | null
) {
  if (!candidate) {
    return false;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/verify_ig_cron_secret`,
    {
      method: "POST",
      headers: restHeaders(),
      body: JSON.stringify({ candidate }),
    }
  );

  if (!response.ok) {
    return false;
  }

  return (await response.json()) === true;
}

interface DuePostRow {
  id: string;
  workspace_id: string;
  content: string;
  menu: {
    media: { file_path: string } | null;
  } | null;
}

async function getDuePosts() {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/posts`
  );

  url.searchParams.set("status", "eq.scheduled");
  url.searchParams.set("platform", "eq.instagram");
  url.searchParams.set(
    "scheduled_at",
    `lte.${new Date().toISOString()}`
  );
  url.searchParams.set(
    "select",
    "id,workspace_id,content,menu:menu_id(media:media_id(file_path))"
  );
  url.searchParams.set("order", "scheduled_at.asc");
  url.searchParams.set("limit", "20");

  const response = await fetch(url, {
    headers: restHeaders(),
  });

  return (await response.json()) as DuePostRow[];
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Método no permitido." },
      405
    );
  }

  const valid = await isValidCronSecret(
    request.headers.get("x-cron-secret")
  );

  if (!valid) {
    return jsonResponse(
      { error: "No autorizado." },
      401
    );
  }

  const duePosts = await getDuePosts();
  const results: Array<{
    postId: string;
    published: boolean;
    error?: string;
  }> = [];

  for (const post of duePosts) {
    const filePath = post.menu?.media?.file_path;

    if (!filePath) {
      results.push({
        postId: post.id,
        published: false,
        error: "sin_fotografia",
      });
      continue;
    }

    const connection = await getConnection(
      post.workspace_id
    );

    if (!connection) {
      results.push({
        postId: post.id,
        published: false,
        error: "sin_conexion",
      });
      continue;
    }

    try {
      const imageUrl = await createSignedImageUrl(
        filePath
      );

      await publishImagePost({
        igUserId: connection.ig_user_id,
        accessToken: connection.access_token,
        imageUrl,
        caption: post.content,
      });

      await markPostPublished(post.id);

      results.push({
        postId: post.id,
        published: true,
      });
    } catch (error) {
      results.push({
        postId: post.id,
        published: false,
        error:
          error instanceof Error
            ? error.message
            : "error_desconocido",
      });
    }
  }

  return jsonResponse({
    processed: duePosts.length,
    published: results.filter((r) => r.published)
      .length,
    results,
  });
});
