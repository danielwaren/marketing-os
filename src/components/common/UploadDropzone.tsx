import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  onClick(): void;
}

export function UploadDropzone({
  onClick,
}: UploadDropzoneProps) {
  return (
    <div className="rounded-xl border-2 border-dashed p-16 text-center">
      <h3 className="text-lg font-semibold">
        Arrastra archivos aquí
      </h3>

      <p className="mt-2 text-muted-foreground">
        Imágenes o videos para Instagram.
      </p>

      <Button
        className="mt-6"
        onClick={onClick}
      >
        Seleccionar archivos
      </Button>
    </div>
  );
}