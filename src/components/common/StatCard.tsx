import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  action?: ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  action,
}: StatCardProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-3xl font-semibold">
          {value}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {action}
      </CardContent>
    </Card>
  );
}