import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { signOut } from "@/features/auth/services/auth.service";

import { ThemeToggle } from "./ThemeToggle";

interface Props {
  title: string;
}

export function Header({
  title,
}: Props) {
  const { user } = useAuth();

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-8 py-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
        )}

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut />
          Salir
        </Button>
      </div>
    </header>
  );
}
