import { loadImage } from "./canvas-utils";
import {
  STORY_TEMPLATES,
  type StoryDesignData,
  type StoryTemplateId,
} from "./templates";

// Resolución estándar de una historia de Instagram (9:16).
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export async function renderStoryDesign(
  templateId: StoryTemplateId,
  photoUrl: string,
  data: StoryDesignData
): Promise<HTMLCanvasElement> {
  const template = STORY_TEMPLATES.find(
    (item) => item.id === templateId
  );

  if (!template) {
    throw new Error("Plantilla de diseño no encontrada.");
  }

  const img = await loadImage(photoUrl);
  const canvas = document.createElement("canvas");

  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "El navegador no permite generar el diseño."
    );
  }

  template.draw(
    ctx,
    STORY_WIDTH,
    STORY_HEIGHT,
    img,
    data
  );

  return canvas;
}

export function canvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(
          new Error(
            "No fue posible exportar el diseño como imagen."
          )
        );
      }
    }, "image/png");
  });
}
