import { Check, Images, Sparkles, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Step {
  label: string;
  description: string;
  href: string;
  icon: typeof Images;
  done: boolean;
}

interface Props {
  hasMedia: boolean;
  hasMenu: boolean;
  hasPosts: boolean;
}

export function OnboardingChecklist({
  hasMedia,
  hasMenu,
  hasPosts,
}: Props) {
  const steps: Step[] = [
    {
      label: "Sube tus fotos",
      description: "Agrega fotografías al banco de contenido.",
      href: "/app/media",
      icon: Images,
      done: hasMedia,
    },
    {
      label: "Crea el menú de hoy",
      description: "Define qué ofreces hoy para que la IA lo use.",
      href: "/app/menu",
      icon: UtensilsCrossed,
      done: hasMenu,
    },
    {
      label: "Genera tu primera publicación",
      description: "Con foto y menú listos, la IA redacta el contenido.",
      href: "/app/posts",
      icon: Sparkles,
      done: hasPosts,
    },
  ];

  const currentIndex = steps.findIndex((step) => !step.done);

  return (
    <section className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Primeros pasos
        </h2>

        <p className="mt-0.5 text-sm text-muted-foreground">
          Completa esto una vez y la app queda lista para funcionar sola.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                isCurrent
                  ? "border-primary/40 bg-card"
                  : "border-transparent"
              }`}
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-success/15 text-success"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {step.done ? (
                  <Check className="size-4" strokeWidth={2.25} />
                ) : (
                  <Icon className="size-4" strokeWidth={1.75} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.done
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {step.label}
                </p>

                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {isCurrent && (
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.href = step.href;
                  }}
                >
                  Empezar
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
