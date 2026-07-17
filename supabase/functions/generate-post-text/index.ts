import {
  DEFAULT_AI_PROVIDER,
  isAIProviderName,
} from "../../../src/features/ai/constants/ai.constants.ts";
import {
  AIProviderError,
  type AIProvider,
} from "../../../src/features/ai/services/providers/ai-provider.interface.ts";
import {
  GeminiProvider,
} from "../../../src/features/ai/services/providers/gemini.provider.ts";
import {
  GroqProvider,
} from "../../../src/features/ai/services/providers/groq.provider.ts";
import {
  TemplatesProvider,
} from "../../../src/features/ai/services/providers/templates.provider.ts";
import type {
  AIProviderName,
  GeneratePostInput,
  GeneratePostResult,
} from "../../../src/features/ai/types/ai.ts";
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

function isShortText(
  value: unknown,
  maxLength: number
) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function hasAuthenticatedUser(
  request: Request
) {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const token = authorization.slice(7);
  const payload = token.split(".")[1];

  if (!payload) {
    return false;
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
    ) as {
      role?: unknown;
      sub?: unknown;
    };

    return (
      claims.role === "authenticated" &&
      typeof claims.sub === "string" &&
      claims.sub.length > 0
    );
  } catch {
    return false;
  }
}

function isValidPayload(
  value: unknown
): value is GeneratePostInput {
  if (
    !value ||
    typeof value !== "object" ||
    !("workspace" in value) ||
    !("menu" in value) ||
    !("platform" in value)
  ) {
    return false;
  }

  const payload =
    value as Partial<GeneratePostInput>;
  const workspace = payload.workspace;
  const menu = payload.menu;
  const action = payload.action ?? "generate";
  const length = payload.length ?? "standard";
  const tone = payload.tone ?? "casual";
  const promptId = payload.promptId ?? "daily-menu";
  const photo = payload.photo;

  if (!workspace || !menu) {
    return false;
  }

  return (
    ["generate", "rewrite", "hashtags", "emojis"].includes(action) &&
    ["standard", "short", "long"].includes(length) &&
    ["formal", "casual", "promotional"].includes(tone) &&
    ["daily-menu", "lunch-invitation", "local-homemade"].includes(promptId) &&
    (
      payload.versionCount === undefined ||
      [2, 3].includes(payload.versionCount)
    ) &&
    (
      photo === undefined ||
      (
        typeof photo === "object" &&
        typeof photo.data === "string" &&
        photo.data.length > 0 &&
        photo.data.length <= 3_000_000 &&
        ["image/jpeg", "image/png", "image/webp"].includes(
          photo.mimeType
        )
      )
    ) &&
    (
      payload.sourceText === undefined ||
      (
        typeof payload.sourceText === "string" &&
        payload.sourceText.length <= 5000
      )
    ) &&
    (
      !["rewrite", "hashtags", "emojis"].includes(action) ||
      isShortText(payload.sourceText, 5000)
    ) &&
    isShortText(workspace.name, 120) &&
    isShortText(workspace.business_type, 120) &&
    isShortText(workspace.city, 120) &&
    (
      workspace.instagram_username === null ||
      (
        typeof workspace.instagram_username ===
          "string" &&
        workspace.instagram_username.length <= 120
      )
    ) &&
    ["menu", "pizza", "both"].includes(
      workspace.content_focus
    ) &&
    ["sales", "followers", "both"].includes(
      workspace.goal
    ) &&
    ["instagram", "facebook", "whatsapp"].includes(
      payload.platform ?? ""
    ) &&
    isShortText(menu.starter, 200) &&
    isShortText(menu.main_course, 200) &&
    isShortText(menu.dessert, 200) &&
    typeof menu.price === "number" &&
    Number.isFinite(menu.price) &&
    menu.price >= 0
  );
}

function getSelectedProvider(): AIProviderName {
  const configured =
    Deno.env.get("AI_PROVIDER")?.trim() ??
    DEFAULT_AI_PROVIDER;

  return isAIProviderName(configured)
    ? configured
    : DEFAULT_AI_PROVIDER;
}

function getRemoteProviders(
  selected: AIProviderName
) {
  const geminiKey =
    Deno.env.get("GEMINI_API_KEY")?.trim() ?? "";
  const groqKey =
    Deno.env.get("GROQ_API_KEY")?.trim() ?? "";
  const providers: AIProvider[] = [];

  if (selected === "gemini") {
    if (geminiKey) {
      providers.push(new GeminiProvider(geminiKey));
    }

    if (groqKey) {
      providers.push(new GroqProvider(groqKey));
    }
  }

  if (selected === "groq") {
    if (groqKey) {
      providers.push(new GroqProvider(groqKey));
    }

    if (geminiKey) {
      providers.push(new GeminiProvider(geminiKey));
    }
  }

  return providers;
}

function getFallbackNotice(
  selected: AIProviderName
) {
  if (selected === "openai") {
    return "OpenAI está desactivado durante el MVP. Se utilizó una plantilla local editable.";
  }

  if (selected === "templates") {
    return "Se utilizó una plantilla local editable.";
  }

  return "No existe una clave válida de Gemini o Groq. Se utilizó una plantilla local editable.";
}

function getProviderNotice(
  selected: AIProviderName,
  provider: AIProviderName
) {
  if (selected === provider) {
    return undefined;
  }

  if (provider === "groq") {
    return "Gemini no estaba disponible. Se utilizó Groq como proveedor alternativo.";
  }

  if (provider === "gemini") {
    return "Groq no estaba disponible. Se utilizó Gemini como proveedor alternativo.";
  }

  return undefined;
}

async function generateSingle(
  generationInput: GeneratePostInput,
  providers: AIProvider[],
  templates: TemplatesProvider,
  selected: AIProviderName,
  hasPhoto: boolean
): Promise<{
  result: GeneratePostResult;
  notice?: string;
}> {
  if (providers.length === 0) {
    const localResult =
      await templates.generatePost(
        generationInput
      );

    return {
      result: localResult,
      notice: getFallbackNotice(selected),
    };
  }

  const failures: AIProviderError[] = [];

  for (const provider of providers) {
    try {
      const result =
        await provider.generatePost(
          generationInput
        );

      return {
        result,
        notice:
          hasPhoto && provider.name === "gemini"
            ? "La publicación se generó analizando la fotografía asociada al menú."
            : getProviderNotice(
                selected,
                provider.name
              ),
      };
    } catch (error) {
      failures.push(
        error instanceof AIProviderError
          ? error
          : new AIProviderError(
              "service_unavailable",
              "El servicio de IA no está disponible temporalmente."
            )
      );
    }
  }

  const failure =
    failures[0] ??
    new AIProviderError(
      "service_unavailable",
      "El servicio de IA no está disponible temporalmente."
    );
  const localResult =
    await templates.generatePost(
      generationInput
    );

  return {
    result: localResult,
    notice: `${failure.message} Se utilizó una plantilla local editable.`,
  };
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

  if (!hasAuthenticatedUser(request)) {
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
        error:
          "Los datos del negocio o del menú están incompletos.",
        code: "invalid_response",
      },
      400
    );
  }

  const selected = getSelectedProvider();
  const context = await getGenerationContext(
    payload.workspace.city,
    Deno.env.get("WEATHER_API_KEY")?.trim() ?? ""
  );
  const generationInput: GeneratePostInput = {
    ...payload,
    context,
  };
  const templates = new TemplatesProvider();
  const providers = getRemoteProviders(selected);

  if (payload.action === "hashtags") {
    const localResult =
      await templates.generatePost(
        generationInput
      );

    return jsonResponse({
      ...localResult,
      context,
      notice:
        "Se agregaron cinco hashtags relevantes sin modificar la publicación.",
    });
  }

  if (payload.action === "emojis") {
    const localResult =
      await templates.generatePost(
        generationInput
      );

    return jsonResponse({
      ...localResult,
      context,
      notice:
        "Se agregaron emojis contextuales sin modificar la publicación.",
    });
  }

  if (payload.versionCount) {
    const versions: GeneratePostResult[] = [];
    let notice: string | undefined;

    for (
      let seed = 0;
      seed < payload.versionCount;
      seed++
    ) {
      const versionInput: GeneratePostInput = {
        ...generationInput,
        variantSeed: seed,
        versionCount: payload.versionCount,
      };
      const generated = await generateSingle(
        versionInput,
        providers,
        templates,
        selected,
        Boolean(payload.photo)
      );

      versions.push(generated.result);
      notice ??= generated.notice;
    }

    return jsonResponse({
      versions,
      context,
      notice:
        notice ??
        `Se generaron ${payload.versionCount} versiones distintas.`,
    });
  }

  const generated = await generateSingle(
    generationInput,
    providers,
    templates,
    selected,
    Boolean(payload.photo)
  );

  return jsonResponse({
    ...generated.result,
    context,
    notice: generated.notice,
  });
});
