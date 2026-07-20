import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
}

export function ThemeToggle() {
  // Arranca en false y se corrige en useEffect (el mismo patrón que
  // NavItem): document.documentElement no existe igual en el server,
  // así que se evita el mismatch calculando esto tras el montaje.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(
      document.documentElement.classList.contains("dark")
    );
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;

    setIsDark(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      aria-label={
        isDark
          ? "Cambiar a modo claro"
          : "Cambiar a modo oscuro"
      }
      title={
        isDark
          ? "Cambiar a modo claro"
          : "Cambiar a modo oscuro"
      }
      className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDark ? (
        <Sun
          className="size-[18px]"
          strokeWidth={1.75}
        />
      ) : (
        <Moon
          className="size-[18px]"
          strokeWidth={1.75}
        />
      )}
    </button>
  );
}
