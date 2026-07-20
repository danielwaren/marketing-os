import type { Media } from "@/features/media/types/media";
import type { DailyMenu } from "@/features/menu/types/daily-menu";

export type SuggestionFormat = "post" | "story";

export interface ContentSuggestion {
  id: string;
  media: Media;
  format: SuggestionFormat;
  title: string;
  reason: string;
}

const GOOGLE_PHOTOS_CATEGORY = "google_photos";
const MAX_SUGGESTIONS = 4;

// Ordena el banco priorizando las fotos recién importadas de Google Photos
// y luego las más nuevas, que son las que conviene sugerir primero.
function sortForSuggestions(media: Media[]) {
  return [...media]
    .filter((item) => item.file_type === "image")
    .sort((a, b) => {
      const aFromGoogle =
        a.category === GOOGLE_PHOTOS_CATEGORY ? 1 : 0;
      const bFromGoogle =
        b.category === GOOGLE_PHOTOS_CATEGORY ? 1 : 0;

      if (aFromGoogle !== bFromGoogle) {
        return bFromGoogle - aFromGoogle;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
}

function getReason(
  media: Media,
  menu: DailyMenu | null
): string {
  if (media.category === GOOGLE_PHOTOS_CATEGORY) {
    return "Recién importada desde Google Photos.";
  }

  if (
    menu &&
    menu.media_id &&
    menu.media_id === media.id
  ) {
    return "Es la foto del menú de hoy.";
  }

  return "Está en el banco de contenido lista para usarse.";
}

// Alterna post/historia para que el dashboard proponga ambos formatos
// a partir de las fotos disponibles en el banco.
export function buildContentSuggestions(
  media: Media[],
  menu: DailyMenu | null
): ContentSuggestion[] {
  const candidates = sortForSuggestions(media).slice(
    0,
    MAX_SUGGESTIONS
  );

  return candidates.map((item, index) => {
    const format: SuggestionFormat =
      index % 2 === 0 ? "post" : "story";

    return {
      id: `${item.id}-${format}`,
      media: item,
      format,
      title:
        format === "post"
          ? "Publicación con esta foto"
          : "Historia con esta foto",
      reason: getReason(item, menu),
    };
  });
}

const SUGGESTION_STORAGE_KEY =
  "marketing-os:content-suggestion";

export interface StoredSuggestion {
  mediaId: string;
  format: SuggestionFormat;
}

// Guarda la sugerencia elegida para que el flujo de publicaciones pueda
// tomarla al abrir /app/posts (handoff entre el dashboard y el editor).
export function stashSuggestion(
  suggestion: ContentSuggestion
) {
  if (typeof window === "undefined") {
    return;
  }

  const stored: StoredSuggestion = {
    mediaId: suggestion.media.id,
    format: suggestion.format,
  };

  window.sessionStorage.setItem(
    SUGGESTION_STORAGE_KEY,
    JSON.stringify(stored)
  );
}

export function readStashedSuggestion(): StoredSuggestion | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(
    SUGGESTION_STORAGE_KEY
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSuggestion;

    if (
      typeof parsed.mediaId === "string" &&
      (parsed.format === "post" ||
        parsed.format === "story")
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export function clearStashedSuggestion() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    SUGGESTION_STORAGE_KEY
  );
}
