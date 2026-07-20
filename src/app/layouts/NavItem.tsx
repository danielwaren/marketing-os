import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

function isActivePath(href: string, path: string) {
  if (href === "/app") {
    return path === "/app" || path === "/app/";
  }

  return path === href || path.startsWith(`${href}/`);
}

export function NavItem({
  label,
  href,
  icon: Icon,
  disabled,
}: Props) {
  // El estado activo depende de window.location, que no existe en el
  // servidor. Se calcula después del montaje para evitar un mismatch de
  // hidratación que React no repara solo (deja el className del server).
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(
      isActivePath(href, window.location.pathname)
    );
  }, [href]);

  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground/50">
        <Icon
          className="size-[18px]"
          strokeWidth={1.75}
        />
        {label}
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
          Pronto
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      suppressHydrationWarning
      className={[
        "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      <Icon
        className="size-[18px]"
        strokeWidth={1.75}
      />
      {label}
    </a>
  );
}
