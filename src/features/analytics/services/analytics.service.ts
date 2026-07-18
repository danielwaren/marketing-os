import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type {
  AnalyticsError,
  AnalyticsErrorCode,
  InstagramInsights,
} from "../types/analytics";

interface FunctionErrorPayload {
  error?: unknown;
  code?: unknown;
}

function isAnalyticsErrorCode(
  value: unknown
): value is AnalyticsErrorCode {
  return [
    "not_connected",
    "invalid_response",
    "service_unavailable",
  ].includes(value as AnalyticsErrorCode);
}

function createError(
  message: string,
  code: AnalyticsErrorCode = "service_unavailable"
): AnalyticsError {
  return { message, code };
}

export async function getInstagramInsights(
  workspaceId: string
) {
  const { data, error } =
    await supabase.functions.invoke<InstagramInsights>(
      "instagram-insights",
      { body: { workspaceId } }
    );

  if (error) {
    let message = error.message;
    let code: AnalyticsErrorCode = "service_unavailable";

    if (error instanceof FunctionsHttpError) {
      try {
        const context =
          await error.context.json() as FunctionErrorPayload;

        if (typeof context.error === "string") {
          message = context.error;
        }

        if (isAnalyticsErrorCode(context.code)) {
          code = context.code;
        }
      } catch {
        // Mantiene el mensaje original de Supabase.
      }
    } else {
      message =
        "No fue posible conectar con el servicio de estadísticas.";
    }

    return {
      data: null,
      error: createError(message, code),
    };
  }

  if (!data) {
    return {
      data: null,
      error: createError(
        "El servicio de estadísticas no devolvió una respuesta utilizable.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}
