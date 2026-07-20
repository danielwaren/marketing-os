import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface Props {
  onSelect(file: File): Promise<void> | void;
}

export function MediaUploader({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);

    await onSelect(file);

    setUploading(false);
    event.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*,video/*"
        onChange={handleChange}
      />

      <Button
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Subiendo..." : "Subir contenido"}
      </Button>
    </>
  );
}
