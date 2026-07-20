import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Select nativo con estilo propio en vez de un dropdown custom: en
// mobile usa el picker del sistema operativo (mejor UX para usuarios
// no técnicos) y no requiere JS extra para funcionar.
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-card px-3.5 py-2 pr-9 text-base text-foreground shadow-xs transition-colors outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm",
          className
        )}
        {...props}
      >
        {children}
      </select>

      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

export { Select }
