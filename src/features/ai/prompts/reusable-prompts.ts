import type {
  AIPostPromptId,
} from "../types/ai.ts";

interface ReusablePostPrompt {
  id: AIPostPromptId;
  label: string;
  description: string;
}

export const REUSABLE_POST_PROMPTS:
  readonly ReusablePostPrompt[] = [
    {
      id: "daily-menu",
      label: "Menú diario",
      description:
        "Presenta claramente los platos y el valor del menú.",
    },
    {
      id: "lunch-invitation",
      label: "Invitación a almorzar",
      description:
        "Invita a hacer una pausa y disfrutar el almuerzo de hoy.",
    },
    {
      id: "local-homemade",
      label: "Comida casera local",
      description:
        "Destaca la preparación casera y el carácter local del negocio.",
    },
  ];
