import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/12 text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/20 text-warning-foreground",
        destructive: "bg-destructive/12 text-destructive",
        outline: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
