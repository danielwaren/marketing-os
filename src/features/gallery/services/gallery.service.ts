import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type {
  GooglePhotosConnectionError,
  GooglePhotosConnectionInput,
  GooglePhotosConnectionStatus,
  GooglePhotosErrorCode,
  PickerActionInput,
  PickerImportResult,
  PickerSessionResult,
  PickerSessionStatus,
} from "../types/gallery";

interface FunctionErrorPayload {
  error?: unknown;
  code?: unknown;
}

function isGooglePhotosErrorCode(
  value: unknown
): value is GooglePhotosErrorCode {
  return [
    "invalid_response",
    "not_configured",
    "oauth_error",
    "workspace_not_found",
    "service_unavailable",
  ].includes(value as GooglePhotosErrorCode);
}

function createServiceError(
  message: string,
  code: GooglePhotosErrorCode = "service_unavailable"
): GooglePhotosConnectionError {
  return { message, code };
}

async function invokeGooglePhotosConnection(
  input: GooglePhotosConnectionInput
) {
  const { data, error } =
    await supabase.functions.invoke<GooglePhotosConnectionStatus>(
      "google-photos-connection",
      { body: input }
    );

  if (error) {
    let message = error.message;
    let code: GooglePhotosErrorCode = "service_unavailable";

    if (error instanceof FunctionsHttpError) {
      try {
        const context =
          await error.context.json() as FunctionErrorPayload;

        if (typeof context.error === "string") {
          message = context.error;
        }

        if (isGooglePhotosErrorCode(context.code)) {
          code = context.code;
        }
      } catch {
        // Mantiene el mensaje original de Supabase.
      }
    } else {
      message =
        "No fue posible conectar con el servicio de Google Photos.";
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
        "El servicio de Google Photos no devolvió una respuesta utilizable.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}

export async function getGooglePhotosStatus(
  workspaceId: string
) {
  return invokeGooglePhotosConnection({
    action: "status",
    workspaceId,
  });
}

export async function connectGooglePhotos(
  workspaceId: string,
  code: string,
  redirectUri: string
) {
  return invokeGooglePhotosConnection({
    action: "connect",
    workspaceId,
    code,
    redirectUri,
  });
}

export async function disconnectGooglePhotos(
  workspaceId: string
) {
  return invokeGooglePhotosConnection({
    action: "disconnect",
    workspaceId,
  });
}

async function invokeGooglePhotosPicker<
  TResult
>(input: PickerActionInput) {
  const { data, error } =
    await supabase.functions.invoke<TResult>(
      "google-photos-picker",
      { body: input }
    );

  if (error) {
    let message = error.message;
    let code: GooglePhotosErrorCode = "service_unavailable";

    if (error instanceof FunctionsHttpError) {
      try {
        const context =
          await error.context.json() as FunctionErrorPayload;

        if (typeof context.error === "string") {
          message = context.error;
        }

        if (isGooglePhotosErrorCode(context.code)) {
          code = context.code;
        }
      } catch {
        // Mantiene el mensaje original de Supabase.
      }
    } else {
      message =
        "No fue posible conectar con el servicio de Google Photos.";
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
        "El servicio de Google Photos no devolvió una respuesta utilizable.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}

export async function createPhotosPickerSession(
  workspaceId: string
) {
  return invokeGooglePhotosPicker<PickerSessionResult>({
    action: "create-session",
    workspaceId,
  });
}

export async function getPhotosPickerSessionStatus(
  workspaceId: string,
  sessionId: string
) {
  return invokeGooglePhotosPicker<PickerSessionStatus>({
    action: "session-status",
    workspaceId,
    sessionId,
  });
}

export async function importPhotosPickerSelection(
  workspaceId: string,
  sessionId: string
) {
  return invokeGooglePhotosPicker<PickerImportResult>({
    action: "import",
    workspaceId,
    sessionId,
  });
}
