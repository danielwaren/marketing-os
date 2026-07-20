import {
  BookOpenText,
  CalendarDays,
  ChartColumnIncreasing,
  GalleryHorizontalEnd,
  Images,
  LayoutDashboard,
  Link2,
  Settings,
  SquarePen,
  UtensilsCrossed,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-5">
      <Logo />

      <Separator className="my-6" />

      <nav className="flex flex-1 flex-col gap-1">
        <NavItem
          href="/app"
          label="Dashboard"
          icon={LayoutDashboard}
        />

        <NavItem
          href="/app/menu"
          label="Menú del día"
          icon={UtensilsCrossed}
        />

        <NavItem
          href="/app/posts"
          label="Publicaciones"
          icon={SquarePen}
        />

        <NavItem
          href="/app/calendar"
          label="Calendario"
          icon={CalendarDays}
        />

        <p className="mt-5 mb-1 px-3.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Contenido
        </p>

        <NavItem
          href="/app/media"
          label="Banco de contenido"
          icon={Images}
        />

        <NavItem
          href="/app/gallery"
          label="Galería (Google Photos)"
          icon={GalleryHorizontalEnd}
        />

        <p className="mt-5 mb-1 px-3.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Instagram
        </p>

        <NavItem
          href="/app/instagram"
          label="Conexión"
          icon={Link2}
        />

        <NavItem
          href="/app/analytics"
          label="Estadísticas"
          icon={ChartColumnIncreasing}
        />

        <div className="mt-auto flex flex-col gap-1 pt-5">
          <Separator className="mb-2" />

          <NavItem
            href="/app/wiki"
            label="Wiki: cómo funciona"
            icon={BookOpenText}
          />

          <NavItem
            href="#"
            label="Configuración"
            icon={Settings}
            disabled
          />
        </div>
      </nav>
    </aside>
  );
}
