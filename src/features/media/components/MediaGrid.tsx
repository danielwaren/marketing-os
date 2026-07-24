import { MediaCard } from "./MediaCard";
import type { Media } from "../types/media";

interface Props {
  media: Media[];
  onDelete(media: Media): Promise<{ error: Error | null }>;
}

export function MediaGrid({ media, onDelete }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {media.map((item) => (
        <MediaCard
          key={item.id}
          media={item}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
