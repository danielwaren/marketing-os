import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
  onPreview?(data: PostSchema): Promise<void>;
}

type PostLength = "short" | "standard" | "long";

const LENGTH_OPTIONS: Array<{
  value: PostLength;
  label: string;
}> = [
  { value: "short", label: "Corto" },
  { value: "standard", label: "Estándar" },
  { value: "long", label: "Largo" },
];

export function PostForm({
  initialValues,
  generationContext,
  mode = "create",
  onSubmit,
  onPreview,
}: Props) {
  const [previewing, setPreviewing] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: {
      errors,
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
  const [length, setLength] =
    useState<PostLength>("standard");
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

  function applyGeneratedText(text: string) {
    setValue("content", text, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleGenerateByLength() {
    const input = await getGenerationInput();

    if (!input) {
      return;
    }

    const result =
      length === "short"
        ? await generateShort(input)
        : length === "long"
          ? await generateLong(input)
          : await generate(input);

    if (result.data) {
      applyGeneratedText(result.data.text);
    }
  }

  async function handleUseTemplate() {
    const input = await getGenerationInput(false);

    if (!input) {
      return;
    }

    const result = await useTemplate(input);

    applyGeneratedText(result.text);
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
      applyGeneratedText(result.data.text);
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
      applyGeneratedText(result.data.text);
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
    applyGeneratedText(text);
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
      applyGeneratedText(result.data.text);
    }
  }

  const isGeneratingLength =
    generating &&
    (operation === "generate" ||
      operation === "short" ||
      operation === "long");

  return (
    <Card>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {mode === "edit" ? (
            <div>
              <label
                htmlFor="post-title"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Título
              </label>

              <Input
                id="post-title"
                aria-invalid={
                  Boolean(errors.title) || undefined
                }
                {...register("title")}
              />

              {errors.title && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
          ) : (
            <input
              type="hidden"
              {...register("title")}
            />
          )}

          {generationContext && (
            <div className="space-y-4 rounded-xl border border-border bg-muted/40 p-5">
              <div>
                <p className="font-medium text-foreground">
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
                  <dd className="font-medium text-foreground">
                    {generationContext.menu.starter}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    Plato principal
                  </dt>
                  <dd className="font-medium text-foreground">
                    {generationContext.menu.main_course}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-muted-foreground">
                    Postre
                  </dt>
                  <dd className="font-medium text-foreground">
                    {generationContext.menu.dessert}
                  </dd>
                </div>
              </dl>

              <p className="text-sm font-medium text-foreground">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="post-prompt"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Enfoque de la publicación
                </label>

                <Select
                  id="post-prompt"
                  value={promptId}
                  onChange={(event) =>
                    setPromptId(
                      event.target.value as AIPostPromptId
                    )
                  }
                  disabled={generating}
                >
                  {REUSABLE_POST_PROMPTS.map((prompt) => (
                    <option
                      key={prompt.id}
                      value={prompt.id}
                    >
                      {prompt.label}
                    </option>
                  ))}
                </Select>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {
                    REUSABLE_POST_PROMPTS.find(
                      (prompt) => prompt.id === promptId
                    )?.description
                  }
                </p>
              </div>

              <div>
                <label
                  htmlFor="post-tone"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Tono de la publicación
                </label>

                <Select
                  id="post-tone"
                  value={tone}
                  onChange={(event) =>
                    setTone(event.target.value as AIPostTone)
                  }
                  disabled={generating}
                >
                  <option value="casual">Cercano</option>
                  <option value="formal">Formal</option>
                  <option value="promotional">Promocional</option>
                </Select>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="post-content"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Publicación
            </label>

            {(mode === "edit" || hasGeneratedContent) ? (
              <>
                <Textarea
                  id="post-content"
                  aria-invalid={
                    Boolean(errors.content) || undefined
                  }
                  {...register("content")}
                  rows={12}
                />

                {errors.content && (
                  <p className="mt-1.5 text-sm text-destructive">
                    {errors.content.message}
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Sparkles
                  className="mx-auto mb-2 size-6 text-primary"
                  strokeWidth={1.75}
                />
                <p className="text-sm text-muted-foreground">
                  Elige la extensión y presiona «Generar con
                  IA» para crear el texto automáticamente.
                </p>
              </div>
            )}

            {!hasGeneratedContent && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    role="radiogroup"
                    aria-label="Extensión de la publicación"
                    className="inline-flex rounded-lg border border-border bg-muted/50 p-1"
                  >
                    {LENGTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={length === option.value}
                        disabled={
                          generating || !generationContext
                        }
                        onClick={() => setLength(option.value)}
                        className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          length === option.value
                            ? "bg-card text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    disabled={
                      generating || !generationContext
                    }
                    onClick={handleGenerateByLength}
                  >
                    <Sparkles />
                    {isGeneratingLength
                      ? "Generando..."
                      : "Generar con IA"}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      generating || !generationContext
                    }
                    onClick={handleGenerateVersions}
                  >
                    {generating && operation === "versions"
                      ? "Generando versiones..."
                      : "Generar 3 versiones"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      generating || !generationContext
                    }
                    onClick={handleUseTemplate}
                  >
                    Usar plantilla local
                  </Button>
                </div>
              </div>
            )}

            {hasGeneratedContent && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    generating || !generationContext
                  }
                  onClick={handleRewrite}
                >
                  {generating && operation === "rewrite"
                    ? "Reescribiendo..."
                    : "Reescribir con IA"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    generating || !generationContext
                  }
                  onClick={handleAddHashtags}
                >
                  {generating && operation === "hashtags"
                    ? "Agregando hashtags..."
                    : "Agregar hashtags"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    generating || !generationContext
                  }
                  onClick={handleAddEmojis}
                >
                  {generating && operation === "emojis"
                    ? "Agregando emojis..."
                    : "Agregar emojis"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={
                    generating || !generationContext
                  }
                  onClick={handleGenerateVersions}
                >
                  {generating && operation === "versions"
                    ? "Generando versiones..."
                    : "Generar 3 versiones"}
                </Button>
              </div>
            )}

            {!generationContext && (
              <p className="mt-2 text-sm text-muted-foreground">
                Crea el menú de hoy para generar el texto.
              </p>
            )}
          </div>

          {versions && versions.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
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
            <Alert variant="info">
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
                    onClick={handleGenerateByLength}
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
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Plataforma
              </label>

              <Select
                {...register("platform")}
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
              </Select>
            </div>
          ) : (
            <input
              type="hidden"
              {...register("platform")}
            />
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            {onPreview && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={
                  isSubmitting ||
                  previewing ||
                  !hasGeneratedContent
                }
                onClick={handleSubmit(async (data) => {
                  setPreviewing(true);
                  await onPreview(data);
                  setPreviewing(false);
                })}
              >
                {previewing
                  ? "Abriendo vista previa..."
                  : "Vista previa"}
              </Button>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={
                isSubmitting || !hasGeneratedContent
              }
            >
              Guardar borrador
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
