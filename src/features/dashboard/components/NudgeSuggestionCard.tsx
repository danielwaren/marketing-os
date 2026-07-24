import { useEffect, useState } from "react";

import { getSignedUrl } from "@/features/media/services/media.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { ContentSuggestion } from "../services/suggestions.service";

interface Props {
  suggestion: ContentSuggestion;
  generating: boolean;
  onGeneratePreview(suggestion: ContentSuggestion): void;
}

const FORMAT_BADGES: Record<
  ContentSuggestion["format"],
  string
> = {
  post: "Post",
  story: "Historia",
};

export function NudgeSuggestionCard({
  suggestion,
  generating,
  onGeneratePreview,
}: Props) {
  const [signedUrl, setSignedUrl] = useState<
    string | null
  >(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await getSignedUrl(
        suggestion.media.file_path
      );

      if (active && data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [suggestion.media.file_path]);

  return (
    <Card className="flex-row items-center gap-3 p-2.5">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {signedUrl && (
          <img
            src={signedUrl}
            alt={
              suggestion.media.description ??
              suggestion.media.file_name
            }
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <Badge
          variant={
            suggestion.format === "story"
              ? "primary"
              : "default"
          }
        >
          {FORMAT_BADGES[suggestion.format]}
        </Badge>

        <Button
          size="sm"
          disabled={generating}
          onClick={() => onGeneratePreview(suggestion)}
          className="w-full"
        >
          {generating
            ? "Generando..."
            : "Generar vista previa"}
        </Button>
      </div>
    </Card>
  );
}
