import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { loadImage } from "./canvas-utils";
import { STORY_WIDTH, STORY_HEIGHT, canvasToBlob } from "./compose";
import {
  STORY_TEMPLATES,
  type StoryDesignData,
  type StoryTemplateId,
} from "./templates";

interface Props {
  photoUrl: string;
  data: StoryDesignData;
  confirming?: boolean;
  onConfirm(
    blob: Blob,
    templateId: StoryTemplateId
  ): void;
  onSkip(): void;
}

export function StoryDesignPicker({
  photoUrl,
  data,
  confirming = false,
  onConfirm,
  onSkip,
}: Props) {
  const canvasRefs = useRef<
    Partial<
      Record<StoryTemplateId, HTMLCanvasElement | null>
    >
  >({});
  const [selected, setSelected] =
    useState<StoryTemplateId | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    setReady(false);
    setError(null);

    loadImage(photoUrl)
      .then((img) => {
        if (!active) return;

        STORY_TEMPLATES.forEach((template) => {
          const canvas = canvasRefs.current[template.id];

          if (!canvas) return;

          canvas.width = STORY_WIDTH;
          canvas.height = STORY_HEIGHT;

          const ctx = canvas.getContext("2d");

          if (!ctx) return;

          template.draw(
            ctx,
            STORY_WIDTH,
            STORY_HEIGHT,
            img,
            data
          );
        });

        setReady(true);
      })
      .catch(() => {
        if (active) {
          setError(
            "No fue posible cargar la fotografía para el diseño."
          );
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    photoUrl,
    data.starter,
    data.main_course,
    data.dessert,
    data.price,
  ]);

  async function handleConfirm() {
    if (!selected) return;

    const canvas = canvasRefs.current[selected];

    if (!canvas) return;

    const blob = await canvasToBlob(canvas);

    onConfirm(blob, selected);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Elige un diseño para la imagen de la historia
      </p>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {STORY_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            disabled={!ready}
            onClick={() => setSelected(template.id)}
            className={`overflow-hidden rounded-lg border-2 text-left transition-colors disabled:opacity-50 ${
              selected === template.id
                ? "border-primary"
                : "border-border"
            }`}
          >
            <canvas
              ref={(element) => {
                canvasRefs.current[template.id] =
                  element;
              }}
              className="aspect-[9/16] w-full bg-muted"
            />

            <p className="p-1.5 text-xs font-medium text-foreground">
              {template.name}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!selected || confirming}
          onClick={handleConfirm}
        >
          {confirming
            ? "Preparando..."
            : "Usar este diseño"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={confirming}
          onClick={onSkip}
        >
          Usar la foto original sin diseño
        </Button>
      </div>
    </div>
  );
}
