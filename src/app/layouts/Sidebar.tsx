import { Separator } from "@/components/ui/separator";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r bg-white p-6">
      <Logo />

      <Separator className="my-8" />

      <nav className="space-y-2">
        <NavItem
          href="/app"
          label="Dashboard"
        />

        <NavItem
          href="/app/media"
          label="Banco de contenido"
        />

        <NavItem
          href="/app/menu"
          label="Menú del día"
        />

        <NavItem
          href="/app/posts"
          label="Post de instagram"
        />

        <NavItem
          href="/app/calendar"
          label="Calendario"
        />

        <NavItem
          href="/app/instagram"
          label="Instagram"
        />

        <NavItem
          href="#"
          label="Configuración"
        />
      </nav>
    </aside>
  );
}
