interface Props {
  label: string;
  value: number | null;
  hint?: string;
}

function formatValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("es-CL").format(value);
}

export function MetricCard({ label, value, hint }: Props) {
  return (
    <article className="flex min-h-40 flex-col justify-between rounded-xl border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground">
        {label}
      </h3>

      <p className="mt-4 text-4xl font-semibold tracking-tight">
        {formatValue(value)}
      </p>

      <p className="mt-3 text-xs text-muted-foreground">
        {value === null
          ? "Instagram aún no reporta este dato."
          : (hint ?? "")}
      </p>
    </article>
  );
}
