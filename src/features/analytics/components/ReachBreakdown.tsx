import type { ReachByFollowType } from "../types/analytics";
import { Card } from "@/components/ui/card";

interface Props {
  breakdown: ReachByFollowType;
}

interface Segment {
  key: keyof ReachByFollowType;
  label: string;
  value: number | null;
  colorClass: string;
}

function formatValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("es-CL").format(value);
}

export function ReachBreakdown({ breakdown }: Props) {
  const segments: Segment[] = [
    {
      key: "nonFollower",
      label: "No te siguen",
      value: breakdown.nonFollower,
      colorClass: "bg-primary",
    },
    {
      key: "follower",
      label: "Te siguen",
      value: breakdown.follower,
      colorClass: "bg-success",
    },
    {
      key: "unknown",
      label: "Sin clasificar",
      value: breakdown.unknown,
      colorClass: "bg-muted-foreground/40",
    },
  ];

  const total = segments.reduce(
    (sum, segment) => sum + (segment.value ?? 0),
    0
  );

  return (
    <Card className="px-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        Alcance por tipo de audiencia
      </h3>

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Instagram aún no reporta este desglose.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {segments.map((segment) => {
              const percentage =
                ((segment.value ?? 0) / total) * 100;

              if (percentage <= 0) {
                return null;
              }

              return (
                <div
                  key={segment.key}
                  className={segment.colorClass}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              );
            })}
          </div>

          <ul className="mt-4 space-y-2">
            {segments.map((segment) => (
              <li
                key={segment.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={`h-2 w-2 rounded-full ${segment.colorClass}`}
                  />
                  {segment.label}
                </span>

                <span className="font-medium">
                  {formatValue(segment.value)}
                  {segment.value !== null && total > 0 && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      (
                      {Math.round(
                        (segment.value / total) * 100
                      )}
                      %)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
