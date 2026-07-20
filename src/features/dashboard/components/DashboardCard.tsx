import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: { label: string; variant: "success" | "warning" };
}

export function DashboardCard({
  icon: Icon,
  title,
  value,
  description,
  actionLabel,
  onClick,
  disabled = false,
  badge,
}: DashboardCardProps) {
  return (
    <Card className="flex min-h-56 flex-col justify-between">
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon
                className="size-5"
                strokeWidth={1.75}
              />
            </div>

            {badge && (
              <Badge variant={badge.variant}>
                {badge.label}
              </Badge>
            )}
          </div>

          <h2 className="mt-3.5 text-sm font-medium text-muted-foreground">
            {title}
          </h2>

          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onClick}
          className="w-fit"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
