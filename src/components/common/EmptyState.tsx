import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed px-8 py-20 text-center">
      <div className="space-y-3 max-w-md">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="text-muted-foreground">
          {description}
        </p>

        {action && (
          <div className="pt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}