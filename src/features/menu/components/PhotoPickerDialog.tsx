import type { Media } from "@/features/media/types/media";
import { useMedia } from "@/features/media/hooks/useMedia";

import { Button } from "@/components/ui/button";

import { SelectableMediaCard } from "./SelectableMediaCard";

interface Props {
  open: boolean;
  selectedId: string | null;
  onClose(): void;
  onSelect(media: Media): void;
}

export function PhotoPickerDialog({
  open,
  selectedId,
  onClose,
  onSelect,
}: Props) {
  const { media, loading } = useMedia();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Seleccionar fotografía
            </h2>

            <p className="text-sm text-muted-foreground">
              Elige una imagen del Banco de Contenido.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>

        {loading ? (
          <p>Cargando imágenes...</p>
        ) : media.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No hay imágenes disponibles.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {media
              .filter((item) => item.file_type === "image")
              .map((item) => (
                <SelectableMediaCard
                  key={item.id}
                  media={item}
                  selected={selectedId === item.id}
                  onSelect={(selectedMedia) => {
                    onSelect(selectedMedia);
                    onClose();
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}