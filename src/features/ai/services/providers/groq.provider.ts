import {
  GROQ_MODEL,
} from "../../constants/ai.constants.ts";
import {
  buildPostPrompt,
  formatPostText,
  POST_SYSTEM_PROMPT,
} from "../../prompts/post.prompt.ts";
import type {
  GeneratePostInput,
} from "../../types/ai.ts";
import {
  AIProviderError,
  type AIProvider,
} from "./ai-provider.interface.ts";

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class GroqProvider
  implements AIProvider {
  readonly name = "groq" as const;

  constructor(
    private readonly apiKey: string,
    private readonly model = GROQ_MODEL
  ) {}

  async generatePost(
    input: GeneratePostInput
  ) {
    if (!this.apiKey) {
      throw new AIProviderError(
        "provider_not_configured",
        "Groq no está configurado."
      );
    }

    let response: Response;

    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: POST_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: buildPostPrompt(input),
              },
            ],
            temperature: 0.8,
            max_completion_tokens: 500,
            reasoning_effort: "none",
          }),
        }
      );
    } catch {
      throw new AIProviderError(
        "network_error",
        "No fue posible conectar con Groq."
      );
    }

    if (response.status === 429) {
      throw new AIProviderError(
        "rate_limit",
        "Groq alcanzó temporalmente su límite de uso."
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new AIProviderError(
        "provider_not_configured",
        "La clave de Groq no es válida o no tiene permisos."
      );
    }

    if (!response.ok) {
      throw new AIProviderError(
        "service_unavailable",
        "Groq no está disponible temporalmente."
      );
    }

    let data: GroqResponse;

    try {
      data = await response.json() as GroqResponse;
    } catch {
      throw new AIProviderError(
        "invalid_response",
        "Groq devolvió una respuesta inválida."
      );
    }

    const text =
      data.choices?.[0]?.message?.content?.trim() ??
      "";

    if (!text) {
      throw new AIProviderError(
        "invalid_response",
        "Groq no devolvió un texto utilizable."
      );
    }

    return {
      text: formatPostText(text, input),
      provider: this.name,
      fallback: false,
    };
  }
}
