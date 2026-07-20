import type { Media } from "@/features/media/types/media";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import type { Workspace } from "@/features/workspace/types/workspace";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { buildContentSuggestions } from "../services/suggestions.service";
import { SuggestionCard } from "./SuggestionCard";
import { AutoPublishToggle } from "./AutoPublishToggle";

interface Props {
  media: Media[];
  menu: DailyMenu | null;
  workspace: Workspace | null;
  instagramConnected: boolean;
  onToggleAutoPublish: (
    value: boolean
  ) => Promise<unknown>;
}

export function ContentSuggestions({
  media,
  menu,
  workspace,
  instagramConnected,
  onToggleAutoPublish,
}: Props) {
  const suggestions = buildContentSuggestions(
    media,
    menu
  );

  const hasStorySuggestion = suggestions.some(
    (suggestion) => suggestion.format === "story"
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Sugerencias de contenido
          </h2>

          <p className="text-sm text-muted-foreground">
            Ideas de posts e historias a partir de las
            fotos de tu banco de contenido.
          </p>
        </div>

        {hasStorySuggestion && workspace && (
          <AutoPublishToggle
            checked={workspace.auto_publish_stories}
            onChange={onToggleAutoPublish}
          />
        )}
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Agrega fotos al banco de contenido —
              subiéndolas o importándolas desde Google
              Photos— y aquí verás sugerencias de posts e
              historias.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/app/media";
                }}
              >
                Ir al banco de contenido
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/app/gallery";
                }}
              >
                Conectar Google Photos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              workspace={workspace}
              menu={menu}
              instagramConnected={
                instagramConnected
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
