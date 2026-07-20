import { useState } from "react";

import { useGeneratePostText } from "@/features/ai/hooks/useGeneratePostText";
import type { SeasonalEvent } from "@/features/ai/types/ai";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import { createPost } from "@/features/posts/services/post.service";
import type { Workspace } from "@/features/workspace/types/workspace";

export type SeasonalPostAutomationState =
  | "idle"
  | "generating"
  | "ready"
  | "saving"
  | "draft_saved"
  | "error";

interface Options {
  workspace: Workspace;
  menu: DailyMenu | null;
}

export function useSeasonalPostAutomation({
  workspace,
  menu,
}: Options) {
  const [state, setState] =
    useState<SeasonalPostAutomationState>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { generate } = useGeneratePostText();

  async function start(event: SeasonalEvent) {
    if (!menu) {
      setError("Crea primero el menú de hoy.");
      setState("error");
      return;
    }

    setError(null);
    setState("generating");
    setText("");

    const result = await generate({
      promptId: "seasonal-event",
      workspace: {
        name: workspace.name,
        business_type: workspace.business_type,
        city: workspace.city,
        instagram_username: workspace.instagram_username,
        content_focus: workspace.content_focus,
        goal: workspace.goal,
      },
      platform: "instagram",
      menu: {
        starter: menu.starter,
        main_course: menu.main_course,
        dessert: menu.dessert,
        price: menu.price,
      },
    });

    if (result.error || !result.data) {
      setError(
        result.error?.message ??
          "No fue posible generar la publicación."
      );
      setState("error");
      return;
    }

    setText(result.data.text);
    setState("ready");
    void event;
  }

  async function saveDraft(title: string) {
    if (!menu) {
      setError("Crea primero el menú de hoy.");
      setState("error");
      return;
    }

    setState("saving");

    const createResult = await createPost(
      workspace.id,
      {
        menu_id: menu.id,
        title,
        content: text,
        platform: "instagram",
      }
    );

    if (createResult.error || !createResult.data) {
      setError(
        "No fue posible guardar la publicación como borrador."
      );
      setState("error");
      return;
    }

    setState("draft_saved");
  }

  function reset() {
    setState("idle");
    setText("");
    setError(null);
  }

  return {
    state,
    text,
    setText,
    error,
    start,
    saveDraft,
    reset,
  };
}
