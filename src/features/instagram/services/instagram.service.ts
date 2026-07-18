import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type {
  InstagramConnectionError,
  InstagramConnectionInput,
  InstagramConnectionStatus,
  InstagramErrorCode,
  InstagramMediaType,
  InstagramPublishResult,
} from "../types/instagram";

interface FunctionErrorPayload {
  error?: unknown;
  code?: unknown;
}

function isInstagramErrorCode(
  value: unknown
): value is InstagramErrorCode {
  return [
    "invalid_response",
    "not_configured",
    "oauth_error",
    "workspace_not_found",
    "service_unavailable",
  ].includes(value as InstagramErrorCode);
}

function createServiceError(
  message: string,
  code: InstagramErrorCode = "service_unavailable"
): InstagramConnectionError {
  return { message, code };
}

async function invokeInstagramConnection(
  input: InstagramConnectionInput
) {
  const { data, error } =
    await supabase.functions.invoke<InstagramConnectionStatus>(
      "instagram-connection",
      { body: input }
    );

  if (error) {
    let message = error.message;
    let code: InstagramErrorCode = "service_unavailable";

    if (error instanceof FunctionsHttpError) {
      try {
        const context =
          await error.context.json() as FunctionErrorPayload;

        if (typeof context.error === "string") {
          message = context.error;
        }

        if (isInstagramErrorCode(context.code)) {
          code = context.code;
        }
      } catch {
        // Mantiene el mensaje original de Supabase.
      }
    } else {
      message =
        "No fue posible conectar con el servicio de Instagram.";
    }

    return {
      data: null,
      error: createServiceError(message, code),
    };
  }

  if (!data) {
    return {
      data: null,
      error: createServiceError(
        "El servicio de Instagram no devolvió una respuesta utilizable.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}

export async function getInstagramStatus(
  workspaceId: string
) {
  return invokeInstagramConnection({
    action: "status",
    workspaceId,
  });
}

export async function connectInstagram(
  workspaceId: string,
  code: string,
  redirectUri: string
) {
  return invokeInstagramConnection({
    action: "connect",
    workspaceId,
    code,
    redirectUri,
  });
}

export async function disconnectInstagram(
  workspaceId: string
) {
  return invokeInstagramConnection({
    action: "disconnect",
    workspaceId,
  });
}

async function invokePublish(
  body: Record<string, unknown>
) {
  const { data, error } =
    await supabase.functions.invoke<InstagramPublishResult>(
      "instagram-publish",
      { body }
    );

  if (error) {
    let message = error.message;

    if (error instanceof FunctionsHttpError) {
      try {
        const context =
          await error.context.json() as FunctionErrorPayload;

        if (typeof context.error === "string") {
          message = context.error;
        }
      } catch {
        // Mantiene el mensaje original de Supabase.
      }
    } else {
      message =
        "No fue posible conectar con el servicio de publicación.";
    }

    return {
      data: null,
      error: createServiceError(message),
    };
  }

  if (!data?.published) {
    return {
      data: null,
      error: createServiceError(
        "Instagram no confirmó la publicación.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}

export async function publishInstagramPost(
  workspaceId: string,
  postId: string,
  mediaType: InstagramMediaType = "feed"
) {
  return invokePublish({
    workspaceId,
    postId,
    mediaType,
  });
}

export async function publishInstagramCarousel(
  workspaceId: string,
  postId: string,
  mediaIds: string[]
) {
  return invokePublish({
    workspaceId,
    postId,
    mediaType: "carousel",
    mediaIds,
  });
}
