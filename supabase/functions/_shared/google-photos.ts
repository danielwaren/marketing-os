declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

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

interface GooglePhotosConnectionRow {
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

async function getConnectionTokens(
  workspaceId: string
): Promise<GooglePhotosConnectionRow | null> {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/google_photos_connections`
  );

  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );
  url.searchParams.set(
    "select",
    "access_token,refresh_token,token_expires_at"
  );

  const response = await fetch(url, {
    headers: restHeaders(),
  });
  const rows =
    await response.json() as GooglePhotosConnectionRow[];

  return rows[0] ?? null;
}

async function persistRefreshedToken(
  workspaceId: string,
  accessToken: string,
  expiresAt: string
) {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/google_photos_connections`
  );

  url.searchParams.set(
    "workspace_id",
    `eq.${workspaceId}`
  );

  await fetch(url, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({
      access_token: accessToken,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }),
  });
}

interface GoogleRefreshResponse {
  access_token?: string;
  expires_in?: number;
  error_description?: string;
}

// Devuelve un access_token vigente para el workspace, renovándolo con el
// refresh_token si está por vencer. Devuelve null si no hay conexión.
export async function getValidAccessToken(
  workspaceId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const row = await getConnectionTokens(workspaceId);

  if (!row) {
    return null;
  }

  const expiresAtMs = new Date(
    row.token_expires_at
  ).getTime();
  const isExpiringSoon =
    expiresAtMs - Date.now() < 60_000;

  if (!isExpiringSoon) {
    return row.access_token;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    { method: "POST", body }
  );
  const data =
    await response.json() as GoogleRefreshResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        "No fue posible renovar el acceso a Google Photos."
    );
  }

  const newExpiresAt = new Date(
    Date.now() + (data.expires_in ?? 3600) * 1000
  ).toISOString();

  await persistRefreshedToken(
    workspaceId,
    data.access_token,
    newExpiresAt
  );

  return data.access_token;
}

const PICKER_BASE =
  "https://photospicker.googleapis.com/v1";

export interface PickerSession {
  id: string;
  pickerUri: string;
  pollingConfig?: { pollInterval?: string };
  mediaItemsSet?: boolean;
}

interface PickerErrorPayload {
  error?: { message?: string };
}

export async function createPickerSession(
  accessToken: string
): Promise<PickerSession> {
  const response = await fetch(
    `${PICKER_BASE}/sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    }
  );
  const data =
    await response.json() as PickerSession &
      PickerErrorPayload;

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        "No fue posible crear la sesión de selección de fotos."
    );
  }

  return data;
}

export async function getPickerSession(
  accessToken: string,
  sessionId: string
): Promise<PickerSession> {
  const response = await fetch(
    `${PICKER_BASE}/sessions/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data =
    await response.json() as PickerSession &
      PickerErrorPayload;

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        "No fue posible consultar la sesión de selección."
    );
  }

  return data;
}

export async function deletePickerSession(
  accessToken: string,
  sessionId: string
) {
  await fetch(
    `${PICKER_BASE}/sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  ).catch(() => {
    // La sesión igual expira sola; no bloquea el import.
  });
}

export interface PickerMediaItem {
  id: string;
  mediaFile?: {
    baseUrl?: string;
    mimeType?: string;
    filename?: string;
  };
}

export async function listPickerMediaItems(
  accessToken: string,
  sessionId: string
): Promise<PickerMediaItem[]> {
  const items: PickerMediaItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `${PICKER_BASE}/mediaItems`
    );

    url.searchParams.set("sessionId", sessionId);

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json() as {
      mediaItems?: PickerMediaItem[];
      nextPageToken?: string;
    } & PickerErrorPayload;

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
          "No fue posible obtener las fotos seleccionadas."
      );
    }

    items.push(...(data.mediaItems ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

// El sufijo "=d" le pide a Google el archivo original sin recomprimir.
export async function downloadMediaItemBytes(
  accessToken: string,
  baseUrl: string
): Promise<Uint8Array> {
  const response = await fetch(`${baseUrl}=d`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      "No fue posible descargar una de las fotos seleccionadas."
    );
  }

  return new Uint8Array(
    await response.arrayBuffer()
  );
}

export async function uploadToMediaBucket(
  filePath: string,
  bytes: Uint8Array,
  contentType: string
) {
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/media/${filePath}`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": contentType,
      },
      body: new Blob([bytes as BlobPart]),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No fue posible guardar una foto en el banco de medios."
    );
  }
}

export interface InsertedMediaRow {
  id: string;
  file_name: string;
  file_path: string;
}

export async function insertMediaRow(row: {
  workspace_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  category: string;
}): Promise<InsertedMediaRow> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/media`,
    {
      method: "POST",
      headers: restHeaders({
        Prefer: "return=representation",
      }),
      body: JSON.stringify(row),
    }
  );
  const rows =
    await response.json() as InsertedMediaRow[];

  if (!response.ok || !rows[0]) {
    throw new Error(
      "No fue posible registrar una foto en el banco de medios."
    );
  }

  return rows[0];
}
