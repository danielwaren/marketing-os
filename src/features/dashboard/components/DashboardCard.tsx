interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function DashboardCard({
  title,
  value,
  description,
  actionLabel,
  onClick,
  disabled = false,
}: DashboardCardProps) {
  return (
    <article className="flex min-h-56 flex-col justify-between rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-base font-medium text-muted-foreground">
          {title}
        </h2>

        <p className="mt-4 text-3xl font-semibold tracking-tight">
          {value}
        </p>

        <p className="mt-3 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="mt-6 w-fit rounded-md border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </article>
  );
}