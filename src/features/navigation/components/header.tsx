import { useAuth } from "@/features/auth/hooks/useAuth";
import { signOut } from "@/features/auth/services/auth.service";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h1 className="font-semibold">
        Marketing OS
      </h1>

      <div className="flex items-center gap-4">
  <span className="text-sm text-muted-foreground">
    {user?.email}
  </span>

  <button
    onClick={async () => {
      await signOut();
      window.location.href = "/login";
    }}
    className="text-sm underline"
  >
    Salir
  </button>
</div>
    </header>
  );
}