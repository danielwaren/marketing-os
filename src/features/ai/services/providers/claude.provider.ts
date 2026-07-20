import {
  CLAUDE_MODEL,
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

interface ClaudeResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

export class ClaudeProvider
  implements AIProvider {
  readonly name = "claude" as const;

  constructor(
    private readonly apiKey: string,
    private readonly model = CLAUDE_MODEL
  ) {}

  async generatePost(
    input: GeneratePostInput
  ) {
    if (!this.apiKey) {
      throw new AIProviderError(
        "provider_not_configured",
        "Claude no está configurado."
      );
    }

    const content: ClaudeContentBlock[] =
      input.photo
        ? [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.photo.mimeType,
                data: input.photo.data,
              },
            },
            {
              type: "text",
              text: buildPostPrompt(input),
            },
          ]
        : [
            {
              type: "text",
              text: buildPostPrompt(input),
            },
          ];

    let response: Response;

    try {
      response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.model,
            system: POST_SYSTEM_PROMPT,
            max_tokens: 500,
            temperature: 0.8,
            messages: [
              {
                role: "user",
                content,
              },
            ],
          }),
        }
      );
    } catch {
      throw new AIProviderError(
        "network_error",
        "No fue posible conectar con Claude."
      );
    }

    if (response.status === 429) {
      throw new AIProviderError(
        "rate_limit",
        "Claude alcanzó temporalmente su límite de uso."
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new AIProviderError(
        "provider_not_configured",
        "La clave de Claude no es válida o no tiene permisos."
      );
    }

    if (!response.ok) {
      throw new AIProviderError(
        "service_unavailable",
        "Claude no está disponible temporalmente."
      );
    }

    let data: ClaudeResponse;

    try {
      data = await response.json() as ClaudeResponse;
    } catch {
      throw new AIProviderError(
        "invalid_response",
        "Claude devolvió una respuesta inválida."
      );
    }

    const text = (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();

    if (!text) {
      throw new AIProviderError(
        "invalid_response",
        "Claude no devolvió un texto utilizable."
      );
    }

    return {
      text: formatPostText(text, input),
      provider: this.name,
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
}
