import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";

import { MediaGrid } from "./MediaGrid";

import { useMedia } from "../hooks/useMedia";
import { MediaUploader } from "./MediaUploader";

export default function MediaPage() {
  const { media, loading, upload } = useMedia();

  async function handleUpload(file: File) {
    const result = await upload(file);

    if (result?.error) {
      alert(result.error.message);
      return;
    }

    alert("Archivo subido correctamente");
  }

  if (loading) {
    return <p>Cargando banco de contenido...</p>;
  }

  const uploader = <MediaUploader onSelect={handleUpload} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Banco de contenido"
        description={
          media.length === 0
            ? "Todavía no has subido imágenes ni videos."
            : `${media.length} archivo${media.length === 1 ? "" : "s"} disponible${media.length === 1 ? "" : "s"}`
        }
        actions={uploader}
      />

      {media.length === 0 ? (
        <EmptyState
          title="Todavía no tienes contenido"
          description="Sube fotografías o videos reales de pizzas, menú diario, pastas y preparaciones."
          action={<MediaUploader onSelect={handleUpload} />}
        />
      ) : (
        <MediaGrid media={media} />
      )}
    </div>
  );
}