import { useEffect, useState } from "react";

import type { Media } from "../types/media";
import { getSignedUrl } from "../services/media.service";

interface Props {
  media: Media;
}

export function MediaCard({ media }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSignedUrl() {
      const { data, error } = await getSignedUrl(media.file_path);

      if (!error && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }

      setLoading(false);
    }

    loadSignedUrl();
  }, [media.file_path]);

  return (
  <article className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
    <div className="aspect-square overflow-hidden bg-muted">
      {loading && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      )}

      {!loading && signedUrl && media.file_type === "image" && (
        <img
          src={signedUrl}
          alt={media.description ?? media.file_name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )}

      {!loading && signedUrl && media.file_type === "video" && (
        <video
          src={signedUrl}
          className="h-full w-full object-cover"
          controls
          preload="metadata"
        />
      )}

      {!loading && !signedUrl && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No se pudo cargar
        </div>
      )}
    </div>

    <div className="space-y-3 p-4">
      <div>
        <h3 className="truncate font-medium">
          {media.file_name}
        </h3>

        <p className="text-sm text-muted-foreground">
          {(media.file_size / 1024 / 1024).toFixed(2)} MB
        </p>

        <p className="text-sm capitalize text-muted-foreground">
          {media.file_type}
        </p>
      </div>

      <button
        type="button"
        className="w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
      >
        Eliminar
      </button>
    </div>
  </article>
);
}