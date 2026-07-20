import { CalendarHeart } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { SeasonalEvent } from "@/features/ai/types/ai";
import type { DailyMenu } from "@/features/menu/types/daily-menu";
import type { Workspace } from "@/features/workspace/types/workspace";

import { useSeasonalPostAutomation } from "../hooks/useSeasonalPostAutomation";

interface Props {
  event: SeasonalEvent;
  message: string;
  workspace: Workspace;
  menu: DailyMenu | null;
}

const BOOST_LABEL: Record<string, string> = {
  largo: "Fin de semana largo",
  puente: "Posible puente",
};

export function SeasonalSuggestionBanner({
  event,
  message,
  workspace,
  menu,
}: Props) {
  const automation = useSeasonalPostAutomation({
    workspace,
    menu,
  });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <CalendarHeart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading font-semibold tracking-tight">
                  {event.name}
                </h3>

                {event.weekendBoost && (
                  <Badge variant="primary">
                    {BOOST_LABEL[event.weekendBoost]}
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
        </div>

        {!menu && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Crea el menú de hoy para poder generar la
              publicación.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = "/app/menu";
              }}
            >
              Crear menú
            </Button>
          </div>
        )}

        {menu && automation.state === "idle" && (
          <Button
            size="sm"
            className="w-fit"
            onClick={() => automation.start(event)}
          >
            Generar con IA
          </Button>
        )}

        {automation.state === "generating" && (
          <p className="text-sm text-muted-foreground">
            Generando publicación con IA...
          </p>
        )}

        {(automation.state === "ready" ||
          automation.state === "saving") && (
            <div className="space-y-2">
              <Textarea
                value={automation.text}
                onChange={(changeEvent) =>
                  automation.setText(
                    changeEvent.target.value
                  )
                }
                rows={4}
                disabled={automation.state === "saving"}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={automation.state === "saving"}
                  onClick={() =>
                    automation.saveDraft(
                      `${event.name} - Sugerencia IA`
                    )
                  }
                >
                  {automation.state === "saving"
                    ? "Guardando..."
                    : "Guardar como borrador"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={automation.state === "saving"}
                  onClick={automation.reset}
                >
                  Descartar
                </Button>
              </div>
            </div>
          )}

        {automation.state === "draft_saved" && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-success">
              Guardada como borrador.
            </p>

            <a
              href="/app/posts"
              className="text-xs text-primary underline underline-offset-2"
            >
              Ver en Publicaciones
            </a>
          </div>
        )}

        {automation.state === "error" && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              {automation.error}
            </p>

            <button
              type="button"
              onClick={automation.reset}
              className="cursor-pointer text-xs text-primary underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
