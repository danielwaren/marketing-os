import { ChefHat } from "lucide-react";

export function Logo() {
  return (
    <a
      href="/app"
      className="flex items-center gap-3"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <ChefHat
          className="size-5"
          strokeWidth={2}
        />
      </div>

      <div>
        <h1 className="font-heading text-[0.95rem] leading-tight font-semibold tracking-tight text-foreground">
          Marketing OS
        </h1>

        <p className="text-xs text-muted-foreground">
          Asistente de negocio
        </p>
      </div>
    </a>
  );
}
