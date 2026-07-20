import { useState } from "react";

import { generateStory } from "../services/story.service";
import type {
  GenerateStoryContext,
  GenerateStoryError,
  GenerateStoryInput,
} from "../types/story";

function buildStoryContext(): GenerateStoryContext {
  const now = new Date();
  const hour = now.getHours();

  const timeOfDay: GenerateStoryContext["timeOfDay"] =
    hour < 12
      ? "mañana"
      : hour < 20
        ? "tarde"
        : "noche";

  const greeting =
    timeOfDay === "mañana"
      ? "Buenos días"
      : timeOfDay === "tarde"
        ? "Buenas tardes"
        : "Buenas noches";

  return {
    weekday: new Intl.DateTimeFormat("es-CL", {
      weekday: "long",
    }).format(now),
    localTime: new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now),
    timeOfDay,
    greeting,
  };
}

export function useGenerateStory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<GenerateStoryError | null>(null);

  async function generate(
    input: Omit<GenerateStoryInput, "context" | "action">
  ) {
    setLoading(true);
    setError(null);

    const result = await generateStory({
      ...input,
      action: "generate",
      context: buildStoryContext(),
    });

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);

    return result;
  }

  return {
    loading,
    error,
    generate,
  };
}
