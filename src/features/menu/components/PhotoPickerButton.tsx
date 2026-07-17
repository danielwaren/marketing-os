import { Button } from "@/components/ui/button";

interface Props {
  fileName?: string;
  onClick(): void;
}

export function PhotoPickerButton({
  fileName,
  onClick,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Foto del menú
      </label>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={onClick}
      >
        {fileName ?? "Elegir desde Banco de Contenido"}
      </Button>
    </div>
  );
}