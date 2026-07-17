import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  useGeneratePostText,
} from "@/features/ai/hooks/useGeneratePostText";
import {
  getPhotoContext,
} from "@/features/ai/services/photo-context.service";
import {
  REUSABLE_POST_PROMPTS,
} from "@/features/ai/prompts/reusable-prompts";
import type {
  AIPostPromptId,
  AIPostTone,
  GeneratePostInput,
} from "@/features/ai/types/ai";

import {
  postSchema,
  type PostSchema,
} from "../schemas/post.schema";

interface Props {
  initialValues: PostSchema;
  generationContext:
    (
      Omit<GeneratePostInput, "platform" | "photo"> & {
        photoPath?: string | null;
      }
    ) | null;
  mode?: "create" | "edit";
  onSubmit(data: PostSchema): Promise<void>;
}

export function PostForm({
  initialValues,
  generationContext,
  mode = "create",
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: {
      isSubmitting,
    },
  } = useForm<PostSchema>({
    resolver: zodResolver(postSchema),
    defaultValues: initialValues,
  });

  const {
    error,
    notice,
    context,
    versions,
    loading: generating,
    operation,
    generate,
    generateShort,
    generateLong,
    rewrite,
    addHashtags,
    addEmojis,
    useTemplate,
    generateVersions,
    clearVersions,
  } = useGeneratePostText();

  const [tone, setTone] =
    useState<AIPostTone>("casual");
  const [promptId, setPromptId] =
    useState<AIPostPromptId>("daily-menu");
  const content = watch("content");
  const hasGeneratedContent =
    content.trim().length >= 10;

  async function getGenerationInput(
    includePhoto = true
  ): Promise<GeneratePostInput | null> {
    if (!generationContext) {
      return null;
    }

    const photo =
      includePhoto && generationContext.photoPath
        ? await getPhotoContext(
            generationContext.photoPath
          )
        : null;
    const {
      photoPath: _photoPath,
      ...baseContext
    } = generationContext;

    return {
      ...baseContext,
      platform: getValues("platform"),
      tone,
      promptId,
      photo: photo ?? undefined,
    };
  }

  async function handleGenerate() {
    const input = await getGenerationInput();

    if (!input) {
      return;
    }

    const result = await generate(input);

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleUseTemplate() {
    const input = await getGenerationInput(false);

    if (!input) {
      return;
    }

    const result = await useTemplate(input);

    setValue("content", result.text, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleGenerateShort() {
    const input = await getGenerationInput();

    if (!input) {
      return;
    }

    const result = await generateShort(input);

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleGenerateLong() {
    const input = await getGenerationInput();

    if (!input) {
      return;
    }

    const result = await generateLong(input);

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleRewrite() {
    const input = await getGenerationInput();
    const sourceText = getValues("content").trim();

    if (!input || sourceText.length < 10) {
      return;
    }

    const result = await rewrite(
      input,
      sourceText
    );

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleAddHashtags() {
    const input = await getGenerationInput(false);
    const sourceText = getValues("content").trim();

    if (!input || sourceText.length < 10) {
      return;
    }

    const result = await addHashtags(
      input,
      sourceText
    );

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleGenerateVersions() {
    const input = await getGenerationInput();

    if (!input) {
      return;
    }

    await generateVersions(input, 3);
  }

  function handleUseVersion(text: string) {
    setValue("content", text, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearVersions();
  }

  async function handleAddEmojis() {
    const input = await getGenerationInput(false);
    const sourceText = getValues("content").trim();

    if (!input || sourceText.length < 10) {
      return;
    }

    const result = await addEmojis(
      input,
      sourceText
    );

    if (result.data) {
      setValue("content", result.data.text, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border p-6"
    >
      {mode === "edit" ? (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Título
          </label>

          <Input
            {...register("title")}
          />
        </div>
      ) : (
        <input
          type="hidden"
          {...register("title")}
        />
      )}

      {generationContext && (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-5">
          <div>
            <p className="font-medium">
              Almuerzo de hoy
            </p>
            <p className="text-sm text-muted-foreground">
              Estos datos se utilizarán automáticamente.
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">
                Entrada
              </dt>
              <dd className="font-medium">
                {generationContext.menu.starter}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Plato principal
              </dt>
              <dd className="font-medium">
                {generationContext.menu.main_course}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-muted-foreground">
                Postre
              </dt>
              <dd className="font-medium">
                {generationContext.menu.dessert}
              </dd>
            </div>
          </dl>

          <p className="text-sm font-medium">
            Incluye jugo y pan amasado hecho en el local.
          </p>

          {generationContext.photoPath && (
            <p className="text-sm text-muted-foreground">
              La fotografía asociada se analizará automáticamente al generar el texto.
            </p>
          )}
        </div>
      )}

      {generationContext && (
        <div>
          <label
            htmlFor="post-prompt"
            className="mb-2 block text-sm font-medium"
          >
            Enfoque de la publicación
          </label>

          <select
            id="post-prompt"
            value={promptId}
            onChange={(event) =>
              setPromptId(
                event.target.value as AIPostPromptId
              )
            }
            disabled={generating}
            className="w-full rounded-md border p-2"
          >
            {REUSABLE_POST_PROMPTS.map((prompt) => (
              <option
                key={prompt.id}
                value={prompt.id}
              >
                {prompt.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-sm text-muted-foreground">
            {
              REUSABLE_POST_PROMPTS.find(
                (prompt) => prompt.id === promptId
              )?.description
            }
          </p>
        </div>
      )}

      {generationContext && (
        <div>
          <label
            htmlFor="post-tone"
            className="mb-2 block text-sm font-medium"
          >
            Tono de la publicación
          </label>

          <select
            id="post-tone"
            value={tone}
            onChange={(event) =>
              setTone(event.target.value as AIPostTone)
            }
            disabled={generating}
            className="w-full rounded-md border p-2"
          >
            <option value="casual">Cercano</option>
            <option value="formal">Formal</option>
            <option value="promotional">Promocional</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">
          Publicación
        </label>

        {(mode === "edit" || hasGeneratedContent) ? (
          <textarea
            {...register("content")}
            rows={12}
            className="w-full rounded-md border p-3"
          />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Presiona “Generar con IA” para crear el texto completo automáticamente.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={
              generating || !generationContext
            }
            onClick={handleGenerate}
          >
            {generating && operation === "generate"
              ? "Generando..."
              : "Generar con IA"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              generating || !generationContext
            }
            onClick={handleGenerateShort}
          >
            {generating && operation === "short"
              ? "Creando texto corto..."
              : "Texto corto"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              generating || !generationContext
            }
            onClick={handleGenerateLong}
          >
            {generating && operation === "long"
              ? "Creando texto largo..."
              : "Texto largo"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={
              generating || !generationContext
            }
            onClick={handleGenerateVersions}
          >
            {generating && operation === "versions"
              ? "Generando versiones..."
              : "Generar 3 versiones"}
          </Button>

          {hasGeneratedContent && (
            <Button
              type="button"
              variant="secondary"
              disabled={
                generating || !generationContext
              }
              onClick={handleRewrite}
            >
              {generating && operation === "rewrite"
                ? "Reescribiendo..."
                : "Reescribir con IA"}
            </Button>
          )}

          {hasGeneratedContent && (
            <Button
              type="button"
              variant="outline"
              disabled={
                generating || !generationContext
              }
              onClick={handleAddHashtags}
            >
              {generating && operation === "hashtags"
                ? "Agregando hashtags..."
                : "Agregar hashtags"}
            </Button>
          )}

          {hasGeneratedContent && (
            <Button
              type="button"
              variant="outline"
              disabled={
                generating || !generationContext
              }
              onClick={handleAddEmojis}
            >
              {generating && operation === "emojis"
                ? "Agregando emojis..."
                : "Agregar emojis"}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={
              generating || !generationContext
            }
            onClick={handleUseTemplate}
          >
            Usar plantilla local
          </Button>
        </div>

        {!generationContext && (
          <p className="mt-2 text-sm text-muted-foreground">
            Crea el menú de hoy para generar el texto.
          </p>
        )}
      </div>

      {versions && versions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Elige una versión para usarla en la publicación
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {versions.map((version, index) => (
              <Card
                key={index}
                size="sm"
              >
                <CardContent>
                  <p className="whitespace-pre-line text-sm">
                    {version.text}
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      handleUseVersion(version.text)
                    }
                  >
                    Usar esta versión
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <Alert>
          <AlertTitle>
            Texto sugerido generado
          </AlertTitle>
          <AlertDescription>
            {notice}
          </AlertDescription>
        </Alert>
      )}

      {context && (
        <Alert>
          <AlertTitle>
            Contexto utilizado
          </AlertTitle>
          <AlertDescription>
            <p>
              {context.greeting}
              {context.weatherSummary
                ? ` · ${context.weatherSummary}`
                : " · Clima no configurado"}
            </p>

            <p className="mt-2">
              Fotografía sugerida: {context.photoSuggestion}
            </p>

            {context.weatherSource && (
              <p className="mt-2 text-xs">
                Clima proporcionado por{
                  " "
                }
                <a
                  href="https://www.weatherapi.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  WeatherAPI.com
                </a>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            No fue posible generar con IA
          </AlertTitle>
          <AlertDescription>
            <p>{error.message}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={generating}
                onClick={handleGenerate}
              >
                Reintentar
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={generating}
                onClick={handleUseTemplate}
              >
                Usar plantilla local
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {mode === "edit" ? (
        <div>
          <label className="mb-2 block text-sm font-medium">
            Plataforma
          </label>

          <select
            {...register("platform")}
            className="w-full rounded-md border p-2"
          >
            <option value="instagram">
              Instagram
            </option>

            <option value="facebook">
              Facebook
            </option>

            <option value="whatsapp">
              WhatsApp
            </option>
          </select>
        </div>
      ) : (
        <input
          type="hidden"
          {...register("platform")}
        />
      )}

      <Button
        type="submit"
        disabled={
          isSubmitting || !hasGeneratedContent
        }
      >
        Guardar borrador
      </Button>
    </form>
  );
}
