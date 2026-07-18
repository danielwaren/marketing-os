import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useMedia } from "@/features/media/hooks/useMedia";
import {
  getSignedUrl,
} from "@/features/media/services/media.service";
import type { Media } from "@/features/media/types/media";

const MIN_ITEMS = 2;
const MAX_ITEMS = 10;

interface CardProps {
  media: Media;
  order: number | null;
  disabled: boolean;
  onToggle(media: Media): void;
}

function SelectableCard({
  media,
  order,
  disabled,
  onToggle,
}: CardProps) {
  const [signedUrl, setSignedUrl] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await getSignedUrl(
        media.file_path
      );

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    }

    load();
  }, [media.file_path]);

  const selected = order !== null;

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      onClick={() => onToggle(media)}
      className={`relative overflow-hidden rounded-xl border text-left transition disabled:opacity-40 ${
        selected
          ? "border-foreground ring-2 ring-foreground"
          : "hover:border-muted-foreground"
      }`}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          {order}
        </span>
      )}

      <div className="aspect-square bg-muted">
        {signedUrl ? (
          <img
            src={signedUrl}
            alt={media.description ?? media.file_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Cargando...
          </div>
        )}
      </div>
    </button>
  );
}

interface Props {
  open: boolean;
  publishing: boolean;
  onClose(): void;
  onConfirm(mediaIds: string[]): void;
}

export function CarouselPickerDialog({
  open,
  publishing,
  onClose,
  onConfirm,
}: Props) {
  const { media, loading } = useMedia();
  const [selectedIds, setSelectedIds] = useState<
    string[]
  >([]);

  if (!open) {
    return null;
  }

  const images = media.filter(
    (item) => item.file_type === "image"
  );

  function toggle(item: Media) {
    setSelectedIds((current) => {
      if (current.includes(item.id)) {
        return current.filter((id) => id !== item.id);
      }

      if (current.length >= MAX_ITEMS) {
        return current;
      }

      return [...current, item.id];
    });
  }

  const canPublish =
    selectedIds.length >= MIN_ITEMS && !publishing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-background shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">
              Elegir imágenes del carrusel
            </h2>
            <p className="text-sm text-muted-foreground">
              Selecciona entre {MIN_ITEMS} y {MAX_ITEMS}{" "}
              imágenes. El número indica el orden en que
              aparecerán.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={publishing}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p>Cargando imágenes...</p>
          ) : images.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              No hay imágenes en el banco de contenido.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {images.map((item) => {
                const index =
                  selectedIds.indexOf(item.id);

                return (
                  <SelectableCard
                    key={item.id}
                    media={item}
                    order={
                      index === -1 ? null : index + 1
                    }
                    disabled={
                      selectedIds.length >= MAX_ITEMS
                    }
                    onToggle={toggle}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t p-6">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} seleccionada
            {selectedIds.length === 1 ? "" : "s"}
          </span>

          <Button
            type="button"
            disabled={!canPublish}
            onClick={() => onConfirm(selectedIds)}
          >
            {publishing
              ? "Publicando carrusel..."
              : "Publicar carrusel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
