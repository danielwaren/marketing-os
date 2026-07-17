interface Props {
  title: string;
}

export function Header({
  title,
}: Props) {
  return (
    <header className="border-b bg-white px-8 py-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {title}
      </h1>
    </header>
  );
}