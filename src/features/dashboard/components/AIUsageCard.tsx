import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAIUsage } from "@/features/ai/hooks/useAIUsage";

interface Props {
  workspaceId: string | null;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

export function AIUsageCard({ workspaceId }: Props) {
  const { summary, loading } = useAIUsage(workspaceId);

  if (loading) {
    return null;
  }

  const totalTokens =
    (summary?.inputTokens ?? 0) +
    (summary?.outputTokens ?? 0);
  const monthLabel = new Intl.DateTimeFormat("es-CL", {
    month: "long",
  }).format(new Date());

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles
              className="size-5"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <h2 className="mt-3.5 text-sm font-medium text-muted-foreground">
          Consumo de IA (Claude) — {monthLabel}
        </h2>

        {!summary || summary.generations === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no se ha generado texto con IA este mes.
          </p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {formatNumber(totalTokens)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                tokens
              </span>
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              {formatNumber(summary.inputTokens)} de
              entrada · {formatNumber(summary.outputTokens)}{" "}
              de salida
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {summary.generations}{" "}
              {summary.generations === 1
                ? "generación"
                : "generaciones"}{" "}
              este mes
            </p>
          </>
        )}

        <p className="mt-3 text-xs text-muted-foreground/80">
          Solo cuenta las respuestas generadas por Claude
          (API de Anthropic). No incluye Gemini, Groq ni
          plantillas locales.
        </p>
      </CardContent>
    </Card>
  );
}
