import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

import type { Media } from "@/features/media/types/media";
import type { DailyMenuSchema } from "../schemas/daily-menu.schema";

import { useDailyMenu } from "../hooks/useDailyMenu";

import { DailyMenuForm } from "./DailyMenuForm";
import { MenuPhoto } from "./MenuPhoto";
import { PhotoPickerDialog } from "./PhotoPickerDialog";
import {
  DEFAULT_DAILY_MENU_PRICE,
} from "../constants";

export default function DailyMenuPage() {
  const {
    menu,
    loading,
    create,
    update,
  } = useDailyMenu();

  const [editing, setEditing] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  async function handleCreate(data: DailyMenuSchema) {
    const { error } = await create({
      ...data,
      price: DEFAULT_DAILY_MENU_PRICE,
      media_id: selectedMedia?.id ?? null,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedMedia(null);
    alert("Menú guardado correctamente");
  }

  async function handleUpdate(data: DailyMenuSchema) {
    if (!menu) {
      return;
    }

    const { error } = await update({
      starter: data.starter,
      main_course: data.main_course,
      dessert: data.dessert,
      price: Number(menu.price),
      media_id: selectedMedia?.id ?? menu.media_id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setEditing(false);
    setSelectedMedia(null);
    alert("Menú actualizado correctamente");
  }

  function handleSelectPhoto(media: Media) {
    setSelectedMedia(media);
    setPhotoDialogOpen(false);
  }

  function handleCancelEdit() {
    setEditing(false);
    setSelectedMedia(null);
    setPhotoDialogOpen(false);
  }

  if (loading) {
    return <p>Cargando menú...</p>;
  }

  const currentPhotoPath =
    selectedMedia?.file_path ??
    menu?.media?.file_path ??
    null;

  const currentPhotoName =
    selectedMedia?.file_name ??
    menu?.media?.file_name ??
    "Sin fotografía seleccionada";

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Menú del día"
          description={
            menu
              ? "Revisa o edita el menú disponible para hoy."
              : "Crea el menú que se utilizará hoy."
          }
        />

        {!menu ? (
          <DailyMenuForm
            onSubmit={handleCreate}
            selectedPhotoName={currentPhotoName}
            onSelectPhoto={() => setPhotoDialogOpen(true)}
          />
        ) : editing ? (
          <DailyMenuForm
            onSubmit={handleUpdate}
            initialValues={{
              starter: menu.starter,
              main_course: menu.main_course,
              dessert: menu.dessert,
              media_id: menu.media_id,
            }}
            selectedPhotoName={currentPhotoName}
            submitLabel="Guardar cambios"
            onSelectPhoto={() => setPhotoDialogOpen(true)}
            onCancel={handleCancelEdit}
          />
        ) : (
          <div className="space-y-6 rounded-xl border p-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Entrada
              </p>
              <p className="font-semibold">
                {menu.starter}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Plato principal
              </p>
              <p className="font-semibold">
                {menu.main_course}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Postre
              </p>
              <p className="font-semibold">
                {menu.dessert}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Precio
              </p>
              <p className="font-semibold">
                ${Number(menu.price).toLocaleString("es-CL")}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Fotografía
              </p>

              {currentPhotoPath ? (
                <MenuPhoto filePath={currentPhotoPath} />
              ) : (
                <p className="font-semibold">
                  Sin fotografía
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setEditing(true)}
            >
              Editar menú
            </Button>
          </div>
        )}
      </div>

      <PhotoPickerDialog
        open={photoDialogOpen}
        selectedId={
          selectedMedia?.id ??
          menu?.media_id ??
          null
        }
        onClose={() => setPhotoDialogOpen(false)}
        onSelect={handleSelectPhoto}
      />
    </>
  );
}
