import { useEffect, useState } from "react";

import type { Media } from "../types/media";
import { getSignedUrl } from "../services/media.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { useConfirm } from "@/hooks/useConfirm";

interface Props {
  media: Media;
  onDelete(media: Media): Promise<{ error: Error | null }>;
}

export function MediaCard({ media, onDelete }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

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

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Eliminar archivo",
      description: `¿Eliminar "${media.file_name}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      variant: "destructive",
    });

    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);

    const { error } = await onDelete(media);

    if (error) {
      setDeleting(false);
      setDeleteError(
        "No fue posible eliminar el archivo. Intenta de nuevo."
      );
    }
  }

  return (
    <Card className="group overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
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

        {media.category === "google_photos" && (
          <span className="absolute top-2 left-2">
            <Badge className="bg-black/70 text-white">
              Google Photos
            </Badge>
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="truncate font-medium text-foreground">
            {media.file_name}
          </h3>

          <p className="text-sm text-muted-foreground">
            {(media.file_size / 1024 / 1024).toFixed(2)} MB
            {" · "}
            <span className="capitalize">
              {media.file_type}
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="w-full cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/8 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>

        {deleteError && (
          <Alert variant="destructive">
            <AlertDescription>
              {deleteError}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {confirmDialog}
    </Card>
  );
}
