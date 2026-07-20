interface Props {
  workspaceName: string;
}

export function DashboardHeader({
  workspaceName,
}: Props) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Buenos días"
      : hour < 20
        ? "Buenas tardes"
        : "Buenas noches";

  return (
    <header className="space-y-1.5">
      <p className="text-sm font-medium text-primary">
        {greeting}
      </p>

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
        {workspaceName}
      </h1>

      <p className="text-muted-foreground">
        Este es el estado actual de tu contenido y menú.
      </p>
    </header>
  );
}