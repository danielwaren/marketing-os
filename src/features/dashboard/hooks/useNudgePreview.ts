import { useState } from "react";

import { useGeneratePostText } from "@/features/ai/hooks/useGeneratePostText";
import { useGenerateStory } from "@/features/ai/hooks/useGenerateStory";
import { getPhotoContext } from "@/features/ai/services/photo-context.service";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import { createPost } from "@/features/posts/services/post.service";
import type { Post } from "@/features/posts/types/post";
import type { Workspace } from "@/features/workspace/types/workspace";

import type { ContentSuggestion } from "../services/suggestions.service";
import { planStoryType } from "../services/story-planner.service";

interface Options {
  workspace: Workspace;
  menu: DailyMenu | null;
}

function toWorkspaceInput(workspace: Workspace) {
  return {
    name: workspace.name,
    business_type: workspace.business_type,
    city: workspace.city,
    instagram_username: workspace.instagram_username,
    content_focus: workspace.content_focus,
    goal: workspace.goal,
  };
}

// Genera el texto con IA (post o historia, según la sugerencia) y lo
// guarda de inmediato como borrador con la foto sugerida asociada, para
// poder abrir la Vista previa de Instagram con un solo clic.
export function useNudgePreview({ workspace, menu }: Options) {
  const [generatingId, setGeneratingId] =
    useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { generate: generatePostText } =
    useGeneratePostText();
  const { generate: generateStoryText } =
    useGenerateStory();

  async function generatePreview(
    suggestion: ContentSuggestion
  ): Promise<Post | null> {
    setGeneratingId(suggestion.id);
    setError(null);

    try {
      const photo = await getPhotoContext(
        suggestion.media.file_path
      );

      if (suggestion.format === "story") {
        const plan = planStoryType(
          new Date(),
          Boolean(menu)
        );

        const result = await generateStoryText({
          workspace: toWorkspaceInput(workspace),
          storyType: plan.type,
          photo: photo ?? undefined,
        });

        if (result.error || !result.data) {
          setError(
            result.error?.message ??
              "No fue posible generar la historia."
          );
          return null;
        }

        const created = await createPost(
          workspace.id,
          {
            menu_id: null,
            media_id: suggestion.media.id,
            title: `Historia IA - ${suggestion.media.file_name}`,
            content: result.data.text,
            platform: "instagram",
          }
        );

        if (created.error || !created.data) {
          setError(
            "No fue posible guardar la historia como borrador."
          );
          return null;
        }

        return created.data;
      }

      if (!menu) {
        setError("Crea primero el menú de hoy.");
        return null;
      }

      const result = await generatePostText({
        workspace: toWorkspaceInput(workspace),
        platform: "instagram",
        menu: {
          starter: menu.starter,
          main_course: menu.main_course,
          dessert: menu.dessert,
          price: Number(menu.price),
        },
        photo: photo ?? undefined,
      });

      if (result.error || !result.data) {
        setError(
          result.error?.message ??
            "No fue posible generar la publicación."
        );
        return null;
      }

      const created = await createPost(workspace.id, {
        menu_id: menu.id,
        media_id: suggestion.media.id,
        title: `${suggestion.title} - ${new Intl.DateTimeFormat("es-CL").format(new Date())}`,
        content: result.data.text,
        platform: "instagram",
      });

      if (created.error || !created.data) {
        setError(
          "No fue posible guardar la publicación como borrador."
        );
        return null;
      }

      return created.data;
    } finally {
      setGeneratingId(null);
    }
  }

  return {
    generatingId,
    error,
    generatePreview,
  };
}
