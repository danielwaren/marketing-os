import { useState } from "react";

import { useGenerateStory } from "@/features/ai/hooks/useGenerateStory";
import { getPhotoContext } from "@/features/ai/services/photo-context.service";
import { publishInstagramPost } from "@/features/instagram/services/instagram.service";
import type { Media } from "@/features/media/types/media";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import { createPost } from "@/features/posts/services/post.service";
import type { Workspace } from "@/features/workspace/types/workspace";

import { planStoryType } from "../services/story-planner.service";

export type StoryAutomationState =
  | "idle"
  | "generating"
  | "ready"
  | "saving"
  | "publishing"
  | "draft_saved"
  | "published"
  | "error";

interface Options {
  workspace: Workspace | null;
  menu: DailyMenu | null;
  instagramConnected: boolean;
  onDone?: () => void;
}

export function useStoryAutomation({
  workspace,
  menu,
  instagramConnected,
  onDone,
}: Options) {
  const [state, setState] =
    useState<StoryAutomationState>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(
    null
  );
  const { generate } = useGenerateStory();

  // La foto va directo en el post (media_id): ya no depende de que la
  // foto sea la del menú del día, así se puede usar cualquier foto
  // del banco (incluidas las de Google Photos).
  async function createDraftPost(
    media: Media,
    content: string
  ) {
    if (!workspace) return null;

    const createResult = await createPost(
      workspace.id,
      {
        menu_id: null,
        media_id: media.id,
        title: `Historia IA - ${media.file_name}`,
        content,
        platform: "instagram",
        format: "story",
      }
    );

    if (createResult.error || !createResult.data) {
      setError(
        "No fue posible guardar la historia como borrador."
      );
      setState("error");
      return null;
    }

    return createResult.data;
  }

  async function saveDraft(media: Media) {
    setState("saving");

    const post = await createDraftPost(media, text);

    if (post) {
      setState("draft_saved");
      onDone?.();
    }
  }

  async function publishNow(
    media: Media,
    content: string = text
  ) {
    if (!workspace) return;

    setState("saving");

    const post = await createDraftPost(
      media,
      content
    );

    if (!post) return;

    setState("publishing");

    const publishResult = await publishInstagramPost(
      workspace.id,
      post.id,
      "stories"
    );

    if (publishResult.error) {
      setError(publishResult.error.message);
      setState("error");
      return;
    }

    setState("published");
    onDone?.();
  }

  async function start(
    media: Media,
    autoPublish: boolean
  ) {
    setError(null);
    setState("generating");
    setText("");

    if (!workspace) {
      setError("No se encontró el negocio.");
      setState("error");
      return;
    }

    const photo = await getPhotoContext(
      media.file_path
    );
    const plan = planStoryType(
      new Date(),
      Boolean(menu)
    );

    const result = await generate({
      workspace: {
        name: workspace.name,
        business_type: workspace.business_type,
        city: workspace.city,
        instagram_username:
          workspace.instagram_username,
        content_focus: workspace.content_focus,
        goal: workspace.goal,
      },
      storyType: plan.type,
      photo: photo ?? undefined,
    });

    if (result.error || !result.data) {
      setError(
        result.error?.message ??
          "No fue posible generar la historia."
      );
      setState("error");
      return;
    }

    setText(result.data.text);

    if (autoPublish && instagramConnected) {
      await publishNow(media, result.data.text);
    } else {
      setState("ready");
    }
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
    publishNow,
    reset,
  };
}
