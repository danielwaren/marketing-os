import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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

const FIELDS: Array<{
  name: keyof Pick<
    DailyMenuSchema,
    "starter" | "main_course" | "dessert"
  >;
  label: string;
  placeholder: string;
}> = [
  {
    name: "starter",
    label: "Entrada",
    placeholder: "Ej: Sopa de verduras",
  },
  {
    name: "main_course",
    label: "Plato principal",
    placeholder: "Ej: Cazuela de vacuno",
  },
  {
    name: "dessert",
    label: "Postre",
    placeholder: "Ej: Leche asada",
  },
];

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
    <Card>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {field.label}
                <span
                  className="ml-0.5 text-destructive"
                  aria-hidden="true"
                >
                  *
                </span>
              </label>

              <Input
                id={field.name}
                placeholder={field.placeholder}
                aria-invalid={
                  Boolean(errors[field.name]) || undefined
                }
                {...register(field.name)}
              />

              {errors[field.name] && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}

          <PhotoPickerButton
            fileName={selectedPhotoName}
            onClick={onSelectPhoto}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
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
      </CardContent>
    </Card>
  );
}
