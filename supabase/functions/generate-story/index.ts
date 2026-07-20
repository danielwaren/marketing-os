import type {
  GenerateStoryInput,
  GenerateStoryResult,
  GenerateStoryError,
} from "../../../src/features/ai/types/story.ts";
import {
  CLAUDE_MODEL,
  GEMINI_MODEL,
  GROQ_MODEL,
} from "../../../src/features/ai/constants/ai.constants.ts";
import {
  getGenerationContext,
} from "../../../src/features/ai/services/weather.service.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
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
  body: unknown,
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

function isValidPayload(
  value: unknown
): value is GenerateStoryInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<GenerateStoryInput>;

  if (!input.workspace) {
    return false;
  }

  const ws = input.workspace;

  if (
    typeof ws.name !== "string" ||
    typeof ws.business_type !== "string" ||
    typeof ws.city !== "string" ||
    typeof ws.content_focus !== "string" ||
    typeof ws.goal !== "string"
  ) {
    return false;
  }

  return true;
}

// Reglas de horario fijas del negocio (no configurables por ahora):
// almuerzo siempre a las 13:00, pizzas desde las 18:00.
const STORY_TYPE_HINTS: Record<string, string> = {
  lunch:
    "Es hora de almuerzo: el local atiende el menú del día desde las 13:00. Invita a la gente a venir a almorzar.",
  pizza_night:
    "Es la hora ideal para promocionar las pizzas artesanales de la noche: el horario de pizzas es desde las 18:00. Menciona las pizzas.",
};

function buildWeatherHint(
  context: GenerateStoryInput["context"]
): string {
  if (!context) return "";

  if (context.isRaining) {
    return "Está lloviendo hoy: puedes mencionar el clima y sugerir algo calentito como las pizzas o el menú del día.";
  }

  if (context.isCold) {
    return "Hace frío hoy: puedes mencionar el clima y sugerir algo calentito como las pizzas o el menú del día.";
  }

  return "";
}

function buildPrompt(input: GenerateStoryInput): string {
  const { workspace, context, action, tone } = input;

  const toneDesc =
    tone === "storytelling"
      ? "narrativa y emotiva"
      : tone === "promotional"
        ? "con CTA directo"
        : "casual y amistosa";

  const contextStr = context
    ? `Es ${context.timeOfDay} (${context.localTime}) en ${context.weekday}.`
    : "";

  const typeHint = input.storyType
    ? STORY_TYPE_HINTS[input.storyType] ?? ""
    : "";
  const weatherHint = buildWeatherHint(context);

  return `Eres un experto en contenido de Instagram Stories para negocios gastronómicos.

Genera una historia breve (~100-150 caracteres) de tono ${toneDesc} para ${workspace.name},
un negocio de tipo "${workspace.business_type}" en ${workspace.city},
enfocado en "${workspace.content_focus}" con objetivo de "${workspace.goal}".

${contextStr}

${typeHint}

${weatherHint}

${input.sourceText ? `Contexto: ${input.sourceText}` : ""}

${input.photo ? "Hay una foto adjunta que puedes referenciar." : ""}

La historia debe:
- Ser breve y pegadiza
- Incluir 1-2 emojis relevantes
- ${action === "rewrite" ? "Ser diferente a anteriores." : "Ser original y fresca."}
- Adaptarse al público de Instagram
- No inventar horarios, precios ni promociones que no se hayan mencionado aquí.

Genera solo el texto de la historia, sin explicaciones ni comillas.`;
}

async function generateWithProvider(
  prompt: string,
  photo?: GenerateStoryInput["photo"]
): Promise<{
  text: string;
  provider: string;
  fallback: boolean;
  usage?: { inputTokens: number; outputTokens: number };
}> {
  const anthropicKey =
    Deno.env.get("ANTHROPIC_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");

  if (anthropicKey) {
    try {
      const body: Record<string, unknown> = {
        model: CLAUDE_MODEL,
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content:
              photo && photo.data
                ? [
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: photo.mimeType,
                        data: photo.data,
                      },
                    },
                    {
                      type: "text",
                      text: prompt,
                    },
                  ]
                : [
                    {
                      type: "text",
                      text: prompt,
                    },
                  ],
          },
        ],
      };

      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json() as {
        content?: Array<{ type?: string; text?: string }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
        };
      };

      if (
        data.content?.[0]?.type === "text" &&
        data.content[0].text
      ) {
        return {
          text: data.content[0].text.trim(),
          provider: "claude",
          fallback: false,
          usage:
            typeof data.usage?.input_tokens === "number" &&
            typeof data.usage?.output_tokens === "number"
              ? {
                  inputTokens: data.usage.input_tokens,
                  outputTokens: data.usage.output_tokens,
                }
              : undefined,
        };
      }
    } catch (error) {
      console.error(
        "Claude generation error:",
        error
      );
    }
  }

  if (geminiKey) {
    try {
      const body: Record<string, unknown> = {
        contents: [
          {
            parts: photo && photo.data
              ? [
                  {
                    inline_data: {
                      mime_type: photo.mimeType,
                      data: photo.data,
                    },
                  },
                  { text: prompt },
                ]
              : [{ text: prompt }],
          },
        ],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": geminiKey,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text =
        data.candidates?.[0]?.content?.parts?.[0]
          ?.text;

      if (text) {
        return {
          text: text.trim(),
          provider: "gemini",
          fallback: false,
        };
      }
    } catch (error) {
      console.error("Gemini generation error:", error);
    }
  }

  if (groqKey) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            max_completion_tokens: 256,
            reasoning_effort: "none",
          }),
        }
      );

      const data = await response.json() as {
        choices?: Array<{
          message?: { content?: string };
        }>;
      };

      const text =
        data.choices?.[0]?.message?.content;

      if (text) {
        return {
          text: text.trim(),
          provider: "groq",
          fallback: false,
        };
      }
    } catch (error) {
      console.error("Groq generation error:", error);
    }
  }

  return {
    text: "📸 Comparte tu historia con nosotros. 🎉",
    provider: "templates",
    fallback: true,
  };
}

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

async function findWorkspaceIdForUser(
  userId: string
): Promise<string | null> {
  const url = new URL(
    `${SUPABASE_URL}/rest/v1/workspaces`
  );

  url.searchParams.set("owner_id", `eq.${userId}`);
  url.searchParams.set("select", "id");

  try {
    const response = await fetch(url, {
      headers: restHeaders(),
    });
    const rows = await response.json() as Array<{
      id: string;
    }>;

    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

// El registro de consumo nunca debe bloquear ni romper la respuesta de
// generación — es informativo, no crítico para el flujo del usuario.
async function logAIUsage(
  workspaceId: string | null,
  provider: string,
  usage: { inputTokens: number; outputTokens: number } | undefined
) {
  if (!workspaceId || !usage) {
    return;
  }

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage_log`,
      {
        method: "POST",
        headers: restHeaders({
          Prefer: "return=minimal",
        }),
        body: JSON.stringify({
          workspace_id: workspaceId,
          provider,
          input_tokens: usage.inputTokens,
          output_tokens: usage.outputTokens,
        }),
      }
    );
  } catch {
    // Silencioso: no afecta la generación si falla el registro.
  }
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

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        error:
          "El cuerpo de la solicitud no es válido.",
        code: "invalid_response",
      },
      400
    );
  }

  if (!isValidPayload(payload)) {
    return jsonResponse(
      {
        error: "Los datos enviados están incompletos.",
        code: "invalid_response",
      },
      400
    );
  }

  // El clima se calcula en el servidor (misma fuente que generate-post-text)
  // para no depender de lo que el cliente crea que hace el clima.
  const weatherContext = await getGenerationContext(
    payload.workspace.city,
    Deno.env.get("WEATHER_API_KEY")?.trim() ?? ""
  );

  const enrichedPayload: GenerateStoryInput = {
    ...payload,
    context: {
      weekday: weatherContext.weekday,
      localTime: weatherContext.localTime,
      timeOfDay: weatherContext.timeOfDay,
      greeting: weatherContext.greeting,
      weatherSummary: weatherContext.weatherSummary,
      isRaining: weatherContext.isRaining,
      isCold: weatherContext.isCold,
    },
  };

  const prompt = buildPrompt(enrichedPayload);

  try {
    const result = await generateWithProvider(
      prompt,
      payload.photo
    );

    const workspaceId = await findWorkspaceIdForUser(
      userId
    );

    await logAIUsage(
      workspaceId,
      result.provider,
      result.usage
    );

    const response: GenerateStoryResult = {
      text: result.text,
      provider: result.provider as any,
      fallback: result.fallback,
      context: enrichedPayload.context,
      usage: result.usage,
    };

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse(
      {
        code: "service_unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al generar la historia.",
        fallbackText:
          "📸 Comparte tu historia con nosotros. 🎉",
      } as GenerateStoryError,
      502
    );
  }
});
