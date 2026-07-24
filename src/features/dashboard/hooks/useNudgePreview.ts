import { useState } from "react";

import { useGeneratePostText } from "@/features/ai/hooks/useGeneratePostText";
import { useGenerateStory } from "@/features/ai/hooks/useGenerateStory";
import { getPhotoContext } from "@/features/ai/services/photo-context.service";
import { getSignedUrl } from "@/features/media/services/media.service";
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

// Borrador de historia pendiente de diseño: ya tiene el texto generado
// por IA, pero falta que el usuario elija cómo componerlo sobre la foto
// (o decida usar la foto tal cual) antes de crear el post.
export interface StoryDraft {
  suggestion: ContentSuggestion;
  photoUrl: string;
  message: string;
}

export function isStoryDraft(
  value: Post | StoryDraft
): value is StoryDraft {
  return "message" in value;
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
  ): Promise<Post | StoryDraft | null> {
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

        const { data: signed } = await getSignedUrl(
          suggestion.media.file_path
        );

        if (!signed?.signedUrl) {
          setError(
            "No fue posible cargar la fotografía para el diseño."
          );
          return null;
        }

        return {
          suggestion,
          photoUrl: signed.signedUrl,
          message: result.data.text,
        };
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
        format: "post",
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

  // Crea el post de la historia una vez que el usuario ya eligió la
  // imagen final (compuesta con el minicanva, o la foto original).
  async function createStoryPost(
    draft: StoryDraft,
    mediaId: string
  ): Promise<Post | null> {
    setError(null);

    const created = await createPost(workspace.id, {
      menu_id: null,
      media_id: mediaId,
      title: `Historia IA - ${draft.suggestion.media.file_name}`,
      content: draft.message,
      platform: "instagram",
      format: "story",
    });

    if (created.error || !created.data) {
      setError(
        "No fue posible guardar la historia como borrador."
      );
      return null;
    }

    return created.data;
  }

  return {
    generatingId,
    error,
    generatePreview,
    createStoryPost,
  };
}
