import { useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Media } from "@/features/media/types/media";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import type { Post } from "@/features/posts/types/post";
import { InstagramPostPreview } from "@/features/posts/components/InstagramPostPreview";
import {
  publishInstagramPost,
} from "@/features/instagram/services/instagram.service";
import { updatePost } from "@/features/posts/services/post.service";
import { uploadComposedImage } from "@/features/media/services/media.service";
import { StoryDesignPicker } from "@/features/story-design/StoryDesignPicker";
import type { StoryTemplateId } from "@/features/story-design/templates";
import type { Workspace } from "@/features/workspace/types/workspace";

import {
  buildContentSuggestions,
  type ContentSuggestion,
} from "../services/suggestions.service";
import {
  getDaysSincePublish,
  getNudgeSeverity,
} from "../services/publish-nudge.service";
import {
  isStoryDraft,
  useNudgePreview,
  type StoryDraft,
} from "../hooks/useNudgePreview";
import { NudgeSuggestionCard } from "./NudgeSuggestionCard";

interface Props {
  posts: Post[];
  media: Media[];
  menu: DailyMenu | null;
  workspace: Workspace;
  instagramConnected: boolean;
}

const SEVERITY_STYLES = {
  never: "border-primary/30 bg-primary/5",
  attention: "border-warning/40 bg-warning/10",
  urgent: "border-destructive/40 bg-destructive/8",
} as const;

const SEVERITY_ICON_STYLES = {
  never: "bg-primary/10 text-primary",
  attention: "bg-warning/20 text-warning-foreground",
  urgent: "bg-destructive/15 text-destructive",
} as const;

function getHeadline(
  severity: "never" | "attention" | "urgent",
  daysSincePublish: number | null
) {
  if (severity === "never") {
    return "Aún no has publicado nada";
  }

  return `No publicas hace ${daysSincePublish} día${daysSincePublish === 1 ? "" : "s"}`;
}

function getSubtext(
  severity: "never" | "attention" | "urgent"
) {
  if (severity === "never") {
    return "Elige una alternativa y publica tu primer contenido — toma menos de un minuto.";
  }

  if (severity === "urgent") {
    return "Tus seguidores llevan varios días sin ver contenido nuevo. Genera la vista previa y publica directo desde ahí.";
  }

  return "Genera la vista previa de cualquiera de estas alternativas y publica directo desde ahí.";
}

export function PublishNudgeBanner({
  posts,
  media,
  menu,
  workspace,
  instagramConnected,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [previewPost, setPreviewPost] =
    useState<Post | null>(null);
  const [storyDraft, setStoryDraft] =
    useState<StoryDraft | null>(null);
  const [composing, setComposing] = useState(false);
  const [publishing, setPublishing] = useState<
    "feed" | "stories" | null
  >(null);
  const [publishError, setPublishError] =
    useState<string | null>(null);

  const {
    generatingId,
    error,
    generatePreview,
    createStoryPost,
  } = useNudgePreview({ workspace, menu });

  const daysSincePublish = getDaysSincePublish(posts);
  const severity = getNudgeSeverity(daysSincePublish);

  if (severity === "none" || dismissed) {
    return null;
  }

  const suggestions: ContentSuggestion[] =
    buildContentSuggestions(media, menu);

  async function handleGeneratePreview(
    suggestion: ContentSuggestion
  ) {
    setPublishError(null);

    const result = await generatePreview(suggestion);

    if (!result) return;

    if (isStoryDraft(result)) {
      setStoryDraft(result);
    } else {
      setPreviewPost(result);
    }
  }

  // El usuario eligió una plantilla del minicanva: compone el texto de
  // la IA sobre la foto, sube la imagen resultante y crea el borrador
  // con esa imagen compuesta.
  async function handleConfirmDesign(blob: Blob) {
    if (!storyDraft) return;

    setComposing(true);
    setPublishError(null);

    const uploaded = await uploadComposedImage(
      workspace.id,
      blob,
      `historia-${Date.now()}.png`
    );

    if (uploaded.error || !uploaded.data) {
      setPublishError(
        "No fue posible preparar el diseño. Intenta de nuevo."
      );
      setComposing(false);
      return;
    }

    const post = await createStoryPost(
      storyDraft,
      (uploaded.data as Media).id
    );

    setComposing(false);

    if (post) {
      setStoryDraft(null);
      setPreviewPost(post);
    }
  }

  // Usa la foto original sin componer texto (comportamiento anterior).
  async function handleSkipDesign() {
    if (!storyDraft) return;

    setComposing(true);
    setPublishError(null);

    const post = await createStoryPost(
      storyDraft,
      storyDraft.suggestion.media.id
    );

    setComposing(false);

    if (post) {
      setStoryDraft(null);
      setPreviewPost(post);
    }
  }

  // La Vista previa ya es el paso de revisión antes de publicar, así que
  // no se pide una segunda confirmación (evita además anidar dos
  // diálogos, uno sobre otro).
  async function handlePublish(
    mediaType: "feed" | "stories"
  ) {
    if (!previewPost) return;

    setPublishing(mediaType);
    setPublishError(null);

    const result = await publishInstagramPost(
      workspace.id,
      previewPost.id,
      mediaType
    );

    setPublishing(null);

    if (result.error) {
      setPublishError(result.error.message);
      return;
    }

    setPreviewPost(null);
    setDismissed(true);
  }

  async function handleSchedule(scheduledAt: string) {
    if (!previewPost) return;

    setPublishError(null);

    const { error: scheduleError } = await updatePost(
      previewPost.id,
      {
        status: "scheduled",
        scheduled_at: scheduledAt,
      }
    );

    if (scheduleError) {
      setPublishError(
        "No fue posible programar la publicación. Intenta de nuevo."
      );
      return;
    }

    setPreviewPost(null);
    setDismissed(true);
  }

  return (
    <>
      <section
        className={`space-y-4 rounded-xl border p-5 ${SEVERITY_STYLES[severity]}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${SEVERITY_ICON_STYLES[severity]}`}
          >
            {severity === "urgent" ? (
              <AlertTriangle
                className="size-5"
                strokeWidth={1.75}
              />
            ) : (
              <Sparkles
                className="size-5"
                strokeWidth={1.75}
              />
            )}
          </div>

          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {getHeadline(severity, daysSincePublish)}
            </h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {getSubtext(severity)}
            </p>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="flex flex-wrap items-center gap-3 pl-13">
            <p className="text-sm text-muted-foreground">
              Agrega fotos a tu banco de contenido para que
              podamos proponerte alternativas.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/app/media";
              }}
            >
              Subir fotos
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((suggestion) => (
              <NudgeSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                generating={generatingId === suggestion.id}
                onGeneratePreview={handleGeneratePreview}
              />
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>

      <InstagramPostPreview
        post={previewPost}
        workspaceName={workspace.name}
        instagramUsername={workspace.instagram_username}
        onClose={() => {
          setPreviewPost(null);
          setPublishError(null);
        }}
        instagramConnected={instagramConnected}
        publishing={publishing}
        error={publishError}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
      />

      <Sheet
        open={Boolean(storyDraft)}
        onOpenChange={(open) => {
          if (!open) {
            setStoryDraft(null);
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>Diseña la historia</SheetTitle>

            <SheetDescription>
              Elige cómo mostrar el texto que generó la IA
              sobre la foto.
            </SheetDescription>
          </SheetHeader>

          <div className="p-4">
            {publishError && (
              <Alert
                variant="destructive"
                className="mb-3"
              >
                <AlertDescription>
                  {publishError}
                </AlertDescription>
              </Alert>
            )}

            {storyDraft && (
              <StoryDesignPicker
                photoUrl={storyDraft.photoUrl}
                data={{
                  kind: "text",
                  eyebrow: "NOVEDAD",
                  message: storyDraft.message,
                }}
                confirming={composing}
                onConfirm={(
                  blob: Blob,
                  _templateId: StoryTemplateId
                ) => handleConfirmDesign(blob)}
                onSkip={handleSkipDesign}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
