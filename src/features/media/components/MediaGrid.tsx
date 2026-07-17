import { MediaCard } from "./MediaCard";
import type { Media } from "../types/media";

interface Props {
  media: Media[];
}

export function MediaGrid({ media }: Props) {
  if (media.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-xl font-semibold">
          Tu banco de contenido está vacío
        </h2>

        <p className="mt-2 text-muted-foreground">
          Sube tus primeras fotos para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
        />
      ))}
    </div>
  );
}