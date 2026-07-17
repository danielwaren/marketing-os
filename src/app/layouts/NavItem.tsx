interface Props {
  label: string;
  href: string;
  active?: boolean;
}

export function NavItem({
  label,
  href,
  active,
}: Props) {
  return (
    <a
      href={href}
      className={[
        "block rounded-xl px-4 py-3 transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "hover:bg-zinc-100",
      ].join(" ")}
    >
      {label}
    </a>
  );
}