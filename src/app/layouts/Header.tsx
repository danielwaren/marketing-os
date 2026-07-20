import { ThemeToggle } from "./ThemeToggle";

interface Props {
  title: string;
}

export function Header({
  title,
}: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-8 py-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <ThemeToggle />
    </header>
  );
}
