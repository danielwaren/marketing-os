import { useRef } from "react";

interface Props {
  onSelect(file: File): void;
}

export function MediaUploader({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            onSelect(file);
          }
        }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="rounded-md border px-4 py-2"
      >
        Subir contenido
      </button>
    </>
  );
}