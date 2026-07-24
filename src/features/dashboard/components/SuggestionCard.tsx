import { useEffect, useState } from "react";

import {
  getSignedUrl,
  uploadComposedImage,
} from "@/features/media/services/media.service";
import type { Media } from "@/features/media/types/media";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import type { Workspace } from "@/features/workspace/types/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StoryDesignPicker } from "@/features/story-design/StoryDesignPicker";
import type { StoryTemplateId } from "@/features/story-design/templates";

import {
  stashSuggestion,
  type ContentSuggestion,
} from "../services/suggestions.service";
import { planStoryType } from "../services/story-planner.service";
import { useStoryAutomation } from "../hooks/useStoryAutomation";

interface Props {
  suggestion: ContentSuggestion;
  workspace: Workspace | null;
  menu: DailyMenu | null;
  instagramConnected: boolean;
}

const FORMAT_BADGES: Record<
  ContentSuggestion["format"],
  string
> = {
  post: "Post",
  story: "Historia",
};

export function SuggestionCard({
  suggestion,
  workspace,
  menu,
  instagramConnected,
}: Props) {
  const [signedUrl, setSignedUrl] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [designedMedia, setDesignedMedia] =
    useState<Media | null>(null);
  const [designSkipped, setDesignSkipped] =
    useState(false);
  const [uploadingDesign, setUploadingDesign] =
    useState(false);
  const [designError, setDesignError] = useState<
    string | null
  >(null);

  const automation = useStoryAutomation({
    workspace,
    menu,
    instagramConnected,
  });
  const plan = planStoryType(
    new Date(),
    Boolean(menu)
  );

  useEffect(() => {
    let active = true;

    async function loadSignedUrl() {
      const { data, error } = await getSignedUrl(
        suggestion.media.file_path
      );

      if (!active) return;

      if (!error && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }

      setLoading(false);
    }

    loadSignedUrl();

    return () => {
      active = false;
    };
  }, [suggestion.media.file_path]);

  function handleUseManually() {
    stashSuggestion(suggestion);
    window.location.href = "/app/posts";
  }

  function handleGenerate() {
    automation.start(
      suggestion.media,
      workspace?.auto_publish_stories ?? false
    );
  }

  async function handleConfirmDesign(
    blob: Blob,
    _templateId: StoryTemplateId
  ) {
    if (!workspace) return;

    setUploadingDesign(true);
    setDesignError(null);

    const result = await uploadComposedImage(
      workspace.id,
      blob,
      `historia-menu-${Date.now()}.png`
    );

    if (result.error || !result.data) {
      setDesignError(
        "No fue posible preparar el diseño. Puedes usar la foto original."
      );
      setUploadingDesign(false);
      return;
    }

    setDesignedMedia(result.data as Media);
    setUploadingDesign(false);
  }

  const activeMedia =
    designedMedia ?? suggestion.media;
  const needsDesignChoice =
    Boolean(menu) &&
    !designedMedia &&
    !designSkipped;

  return (
    <Card className="overflow-hidden py-0">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        )}

        {!loading && signedUrl && (
          <img
            src={signedUrl}
            alt={
              suggestion.media.description ??
              suggestion.media.file_name
            }
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {!loading && !signedUrl && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No se pudo cargar
          </div>
        )}

        <span className="absolute top-3 left-3">
          <Badge
            variant={
              suggestion.format === "story"
                ? "primary"
                : "default"
            }
            className="bg-black/70 text-white"
          >
            {FORMAT_BADGES[suggestion.format]}
          </Badge>
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 py-4">
        <div>
          <h3 className="font-medium text-foreground">
            {suggestion.title}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {suggestion.reason}
          </p>
        </div>

        {suggestion.format === "post" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseManually}
            className="w-full"
          >
            Crear post con esta foto
          </Button>
        )}

        {suggestion.format === "story" && (
          <div className="space-y-3">
            {automation.state === "idle" && (
              <>
                <p className="text-xs text-muted-foreground">
                  Sugerencia de la IA:{" "}
                  <span className="font-medium text-foreground">
                    {plan.label}
                  </span>
                </p>

                <Button
                  size="sm"
                  onClick={handleGenerate}
                  className="w-full"
                >
                  {workspace?.auto_publish_stories
                    ? "Generar y publicar con IA"
                    : "Generar historia con IA"}
                </Button>

                <button
                  type="button"
                  onClick={handleUseManually}
                  className="w-full cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  o crear historia manualmente
                </button>
              </>
            )}

            {automation.state === "generating" && (
              <p className="text-sm text-muted-foreground">
                Generando historia con IA...
              </p>
            )}

            {automation.state === "ready" &&
              needsDesignChoice &&
              menu &&
              signedUrl && (
                <div className="space-y-2">
                  {designError && (
                    <p className="text-xs text-destructive">
                      {designError}
                    </p>
                  )}

                  <StoryDesignPicker
                    photoUrl={signedUrl}
                    data={{
                      kind: "menu",
                      starter: menu.starter,
                      main_course: menu.main_course,
                      dessert: menu.dessert,
                      price: Number(menu.price),
                    }}
                    confirming={uploadingDesign}
                    onConfirm={handleConfirmDesign}
                    onSkip={() =>
                      setDesignSkipped(true)
                    }
                  />
                </div>
              )}

            {automation.state === "ready" &&
              !needsDesignChoice && (
              <div className="space-y-2">
                {designedMedia && (
                  <p className="text-xs font-medium text-success">
                    Diseño aplicado a la imagen de la
                    historia.
                  </p>
                )}

                <Textarea
                  value={automation.text}
                  onChange={(event) =>
                    automation.setText(
                      event.target.value
                    )
                  }
                  rows={3}
                  className="min-h-0 text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      automation.saveDraft(
                        activeMedia
                      )
                    }
                    className="flex-1"
                  >
                    Guardar borrador
                  </Button>

                  <Button
                    size="sm"
                    disabled={!instagramConnected}
                    onClick={() =>
                      automation.publishNow(
                        activeMedia
                      )
                    }
                    className="flex-1"
                  >
                    Publicar ahora
                  </Button>
                </div>

                {!instagramConnected && (
                  <p className="text-xs text-warning-foreground">
                    Conecta Instagram para publicar
                    directamente.
                  </p>
                )}
              </div>
            )}

            {(automation.state === "saving" ||
              automation.state === "publishing") && (
              <p className="text-sm text-muted-foreground">
                {automation.state === "publishing"
                  ? "Publicando historia..."
                  : "Guardando..."}
              </p>
            )}

            {automation.state === "draft_saved" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-success">
                  Guardada como borrador.
                </p>
                <a
                  href="/app/posts"
                  className="text-xs text-primary underline underline-offset-2"
                >
                  Ver en Publicaciones
                </a>
              </div>
            )}

            {automation.state === "published" && (
              <p className="text-sm font-medium text-success">
                Historia publicada en Instagram.
              </p>
            )}

            {automation.state === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  {automation.error}
                </p>
                <button
                  type="button"
                  onClick={automation.reset}
                  className="cursor-pointer text-xs text-primary underline underline-offset-2"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
