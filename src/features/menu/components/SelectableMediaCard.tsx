import { useEffect, useState } from "react";

import type { Media } from "@/features/media/types/media";
import { getSignedUrl } from "@/features/media/services/media.service";

interface Props {
  media: Media;
  selected: boolean;
  onSelect(media: Media): void;
}

export function SelectableMediaCard({
  media,
  selected,
  onSelect,
}: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      const { data, error } = await getSignedUrl(media.file_path);

      if (!error && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    }

    loadImage();
  }, [media.file_path]);

  return (
    <button
      type="button"
      onClick={() => onSelect(media)}
      className={[
        "overflow-hidden rounded-xl border text-left transition",
        selected
          ? "border-foreground ring-2 ring-foreground"
          : "hover:border-muted-foreground",
      ].join(" ")}
    >
      <div className="aspect-square bg-muted">
        {signedUrl && media.file_type === "image" ? (
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

      <div className="p-3">
        <p className="truncate text-sm font-medium">
          {media.file_name}
        </p>
      </div>
    </button>
  );
}