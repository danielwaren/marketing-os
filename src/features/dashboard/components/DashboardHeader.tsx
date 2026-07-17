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
    <header className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        {greeting}
      </p>

      <h1 className="text-4xl font-semibold tracking-tight">
        {workspaceName}
      </h1>

      <p className="text-muted-foreground">
        Este es el estado actual de tu contenido y menú.
      </p>
    </header>
  );
}