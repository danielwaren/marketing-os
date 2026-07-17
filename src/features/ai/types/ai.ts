export type AIProviderName =
  | "gemini"
  | "groq"
  | "templates"
  | "openai";

export type AIPostAction =
  | "generate"
  | "rewrite"
  | "hashtags"
  | "emojis";

export type AIPostLength =
  | "standard"
  | "short"
  | "long";

export type AIPostTone =
  | "formal"
  | "casual"
  | "promotional";

export type AIPostPromptId =
  | "daily-menu"
  | "lunch-invitation"
  | "local-homemade";

export type AIErrorCode =
  | "provider_not_configured"
  | "rate_limit"
  | "network_error"
  | "invalid_response"
  | "service_unavailable";

export type AIPostVersionCount = 2 | 3;

export interface GeneratePostInput {
  action?: AIPostAction;
  length?: AIPostLength;
  tone?: AIPostTone;
  promptId?: AIPostPromptId;
  sourceText?: string;
  versionCount?: AIPostVersionCount;
  variantSeed?: number;
  photo?: {
    data: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
  };
  workspace: {
    name: string;
    business_type: string;
    city: string;
    instagram_username: string | null;
    content_focus: "menu" | "pizza" | "both";
    goal: "sales" | "followers" | "both";
  };
  platform:
    | "instagram"
    | "facebook"
    | "whatsapp";
  menu: {
    starter: string;
    main_course: string;
    dessert: string;
    price: number;
  };
  context?: GeneratePostContext;
}

export interface GeneratePostContext {
  weekday: string;
  localTime: string;
  timeOfDay: "mañana" | "tarde" | "noche";
  greeting: string;
  weatherSummary: string | null;
  isRaining: boolean;
  isCold: boolean;
  photoSuggestion: string;
  weatherSource: "WeatherAPI.com" | null;
}

export interface GeneratePostResult {
  text: string;
  provider: AIProviderName;
  fallback: boolean;
  notice?: string;
  context?: GeneratePostContext;
}

export interface GeneratePostError {
  code: AIErrorCode;
  message: string;
  fallbackText: string | null;
}

export interface GeneratePostVersion {
  text: string;
  provider: AIProviderName;
  fallback: boolean;
}

export interface GeneratePostVersionsResult {
  versions: GeneratePostVersion[];
  notice?: string;
  context?: GeneratePostContext;
}
