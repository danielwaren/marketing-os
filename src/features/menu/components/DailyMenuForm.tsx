import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  dailyMenuSchema,
  type DailyMenuSchema,
} from "../schemas/daily-menu.schema";

import { PhotoPickerButton } from "./PhotoPickerButton";

interface Props {
  onSubmit(data: DailyMenuSchema): Promise<void>;
  initialValues?: Partial<DailyMenuSchema>;
  selectedPhotoName?: string;
  submitLabel?: string;
  onSelectPhoto(): void;
  onCancel?: () => void;
}

export function DailyMenuForm({
  onSubmit,
  initialValues,
  selectedPhotoName,
  submitLabel = "Guardar menú",
  onSelectPhoto,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DailyMenuSchema>({
    resolver: zodResolver(dailyMenuSchema),
    defaultValues: {
      starter: initialValues?.starter ?? "",
      main_course: initialValues?.main_course ?? "",
      dessert: initialValues?.dessert ?? "",
      media_id: initialValues?.media_id ?? null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border p-6"
    >
      <div>
        <label className="mb-2 block text-sm font-medium">
          Entrada
        </label>

        <Input
          placeholder="Ej: Sopa de verduras"
          {...register("starter")}
        />

        {errors.starter && (
          <p className="mt-1 text-sm text-red-500">
            {errors.starter.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Plato principal
        </label>

        <Input
          placeholder="Ej: Cazuela de vacuno"
          {...register("main_course")}
        />

        {errors.main_course && (
          <p className="mt-1 text-sm text-red-500">
            {errors.main_course.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Postre
        </label>

        <Input
          placeholder="Ej: Leche asada"
          {...register("dessert")}
        />

        {errors.dessert && (
          <p className="mt-1 text-sm text-red-500">
            {errors.dessert.message}
          </p>
        )}
      </div>

      <PhotoPickerButton
        fileName={selectedPhotoName}
        onClick={onSelectPhoto}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
