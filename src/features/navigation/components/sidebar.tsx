const items = [
  "Dashboard",
  "Biblioteca",
  "Instagram",
  "Menú",
  "IA",
  "Configuración",
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="p-6">
        <h2 className="text-xl font-semibold">
          Marketing OS
        </h2>
      </div>

      <nav className="space-y-1 px-3">
        {items.map((item) => (
          <button
            key={item}
            className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}