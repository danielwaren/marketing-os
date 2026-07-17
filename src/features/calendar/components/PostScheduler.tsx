import { useId, useState } from "react";

import { Button } from "@/components/ui/button";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalInputValue(date: Date) {
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function getDefaultValue() {
  const date = new Date();

  date.setHours(date.getHours() + 1, 0, 0, 0);

  return toLocalInputValue(date);
}

interface Props {
  disabled?: boolean;
  initialValue?: string;
  label?: string;
  savingLabel?: string;
  onSchedule(scheduledAt: string): Promise<unknown> | unknown;
}

export function PostScheduler({
  disabled,
  initialValue,
  label = "Programar",
  savingLabel = "Programando...",
  onSchedule,
}: Props) {
  const [value, setValue] = useState(() =>
    initialValue
      ? toLocalInputValue(new Date(initialValue))
      : getDefaultValue()
  );
  const [error, setError] = useState<string | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const inputId = useId();

  async function handleSchedule() {
    if (!value) {
      setError("Selecciona una fecha y hora.");
      return;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      setError("La fecha no es válida.");
      return;
    }

    if (date.getTime() <= Date.now()) {
      setError("La fecha debe ser futura.");
      return;
    }

    setError(null);
    setSaving(true);

    await onSchedule(date.toISOString());

    setSaving(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        className="sr-only"
        htmlFor={inputId}
      >
        Fecha de programación
      </label>

      <input
        id={inputId}
        type="datetime-local"
        value={value}
        min={toLocalInputValue(new Date())}
        disabled={disabled || saving}
        onChange={(event) =>
          setValue(event.target.value)
        }
        className="h-8 rounded-lg border bg-background px-2.5 text-sm"
      />

      <Button
        size="sm"
        variant="outline"
        disabled={disabled || saving}
        onClick={handleSchedule}
      >
        {saving ? savingLabel : label}
      </Button>

      {error && (
        <span className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
