import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: number | null;
  hint?: string;
  previousValue?: number | null;
}

function formatValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("es-CL").format(value);
}

function getComparison(
  value: number | null,
  previousValue: number | null | undefined
) {
  if (
    value === null ||
    previousValue === null ||
    previousValue === undefined
  ) {
    return null;
  }

  if (previousValue === 0) {
    return value === 0
      ? { text: "Sin cambios vs. período anterior", tone: "neutral" as const }
      : { text: "Nuevo vs. período anterior", tone: "up" as const };
  }

  const changePercent =
    ((value - previousValue) / previousValue) * 100;

  if (Math.abs(changePercent) < 1) {
    return {
      text: "Sin cambios vs. período anterior",
      tone: "neutral" as const,
    };
  }

  const rounded = Math.round(Math.abs(changePercent));

  return changePercent > 0
    ? {
        text: `↑ ${rounded}% vs. período anterior`,
        tone: "up" as const,
      }
    : {
        text: `↓ ${rounded}% vs. período anterior`,
        tone: "down" as const,
      };
}

const TONE_CLASSES = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function MetricCard({
  label,
  value,
  hint,
  previousValue,
}: Props) {
  const comparison = getComparison(value, previousValue);

  return (
    <Card className="flex min-h-40 flex-col justify-between px-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        {label}
      </h3>

      <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
        {formatValue(value)}
      </p>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">
          {value === null
            ? "Instagram aún no reporta este dato."
            : (hint ?? "")}
        </p>

        {comparison && (
          <p
            className={`text-xs font-medium ${TONE_CLASSES[comparison.tone]}`}
          >
            {comparison.text}
          </p>
        )}
      </div>
    </Card>
  );
}
