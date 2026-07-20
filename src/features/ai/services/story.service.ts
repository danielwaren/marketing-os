import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type {
  AIStoryErrorCode,
  GenerateStoryError,
  GenerateStoryInput,
  GenerateStoryResult,
} from "../types/story";

interface FunctionErrorPayload {
  error?: unknown;
  code?: unknown;
  fallback_text?: unknown;
}

function isAIStoryErrorCode(
  value: unknown
): value is AIStoryErrorCode {
  return [
    "provider_not_configured",
    "rate_limit",
    "network_error",
    "invalid_response",
    "service_unavailable",
  ].includes(value as AIStoryErrorCode);
}

function createServiceError(
  message: string,
  code: AIStoryErrorCode = "service_unavailable",
  fallbackText: string | null = null
): GenerateStoryError {
  return { message, code, fallbackText };
}

async function resolveFunctionError(
  error: unknown
): Promise<GenerateStoryError> {
  let message =
    error instanceof Error
      ? error.message
      : "No fue posible conectar con el servicio de IA.";
  let code: AIStoryErrorCode = "service_unavailable";
  let fallbackText: string | null = null;

  if (error instanceof FunctionsHttpError) {
    try {
      const context =
        await error.context.json() as FunctionErrorPayload;

      if (typeof context.error === "string") {
        message = context.error;
      }

      if (isAIStoryErrorCode(context.code)) {
        code = context.code;
      }

      if (
        typeof context.fallback_text === "string"
      ) {
        fallbackText = context.fallback_text;
      }
    } catch {
      // Mantiene el mensaje original de Supabase.
    }
  } else {
    code = "network_error";
    message =
      "No fue posible conectar con el servicio de IA.";
  }

  return createServiceError(
    message,
    code,
    fallbackText
  );
}

export async function generateStory(
  input: GenerateStoryInput
) {
  const { data, error } =
    await supabase.functions.invoke<GenerateStoryResult>(
      "generate-story",
      { body: input }
    );

  if (error) {
    return {
      data: null,
      error: await resolveFunctionError(error),
    };
  }

  if (!data?.text) {
    return {
      data: null,
      error: createServiceError(
        "La IA no devolvió un texto utilizable.",
        "invalid_response"
      ),
    };
  }

  return { data, error: null };
}
