import {
  FunctionsHttpError,
} from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type {
  AIErrorCode,
  GeneratePostError,
  GeneratePostInput,
  GeneratePostResult,
  GeneratePostVersionsResult,
} from "../types/ai";

interface FunctionErrorPayload {
  error?: unknown;
  code?: unknown;
  fallback_text?: unknown;
}

function isAIErrorCode(
  value: unknown
): value is AIErrorCode {
  return [
    "provider_not_configured",
    "rate_limit",
    "network_error",
    "invalid_response",
    "service_unavailable",
  ].includes(value as AIErrorCode);
}

function createServiceError(
  message: string,
  code: AIErrorCode = "service_unavailable",
  fallbackText: string | null = null
): GeneratePostError {
  return {
    message,
    code,
    fallbackText,
  };
}

async function resolveFunctionError(
  error: unknown
): Promise<GeneratePostError> {
  let message =
    error instanceof Error
      ? error.message
      : "No fue posible conectar con el servicio de IA.";
  let code: AIErrorCode = "service_unavailable";
  let fallbackText: string | null = null;

  if (error instanceof FunctionsHttpError) {
    try {
      const context =
        await error.context.json() as FunctionErrorPayload;

      if (typeof context.error === "string") {
        message = context.error;
      }

      if (isAIErrorCode(context.code)) {
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

export async function generatePostText(
  input: GeneratePostInput
) {
  const { data, error } =
    await supabase.functions.invoke<GeneratePostResult>(
      "generate-post-text",
      {
        body: input,
      }
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

  return {
    data,
    error: null,
  };
}

export async function generatePostVersions(
  input: GeneratePostInput
) {
  const { data, error } =
    await supabase.functions.invoke<GeneratePostVersionsResult>(
      "generate-post-text",
      {
        body: input,
      }
    );

  if (error) {
    return {
      data: null,
      error: await resolveFunctionError(error),
    };
  }

  if (!data?.versions?.length) {
    return {
      data: null,
      error: createServiceError(
        "La IA no devolvió versiones utilizables.",
        "invalid_response"
      ),
    };
  }

  return {
    data,
    error: null,
  };
}
