import { useState } from "react";

interface Props {
  checked: boolean;
  onChange: (value: boolean) => Promise<unknown>;
}

export function AutoPublishToggle({
  checked,
  onChange,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    await onChange(!checked);
    setSaving(false);
  }

  return (
    <label className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm shadow-xs">
      <span className="text-muted-foreground">
        Auto-publicar historias de IA
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={saving}
        onClick={handleClick}
        className={`relative h-5.5 w-10 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-4.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
