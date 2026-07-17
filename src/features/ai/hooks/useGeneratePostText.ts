import { useState } from "react";

import {
  generatePostTextSchema,
} from "../schemas/generate-post-text.schema";
import {
  generatePostText,
  generatePostVersions,
} from "../services/ai.service";
import {
  TemplatesProvider,
} from "../services/providers/templates.provider";
import type {
  AIPostVersionCount,
  GeneratePostError,
  GeneratePostContext,
  GeneratePostInput,
  GeneratePostVersion,
} from "../types/ai";

export function useGeneratePostText() {
  const [error, setError] =
    useState<GeneratePostError | null>(null);
  const [notice, setNotice] =
    useState<string | null>(null);
  const [context, setContext] =
    useState<GeneratePostContext | null>(null);
  const [versions, setVersions] =
    useState<GeneratePostVersion[] | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [operation, setOperation] =
    useState<"generate" | "rewrite" | "short" | "long" | "hashtags" | "emojis" | "versions" | null>(null);

  async function run(
    input: GeneratePostInput,
    nextOperation:
      "generate" | "rewrite" | "short" | "long" | "hashtags" | "emojis"
  ) {
    setLoading(true);
    setOperation(nextOperation);
    setError(null);
    setNotice(null);
    setVersions(null);

    const parsed =
      generatePostTextSchema.safeParse(input);

    if (!parsed.success) {
      const validationError: GeneratePostError = {
        code: "invalid_response",
        message:
          "Los datos del negocio o del menú están incompletos.",
        fallbackText: null,
      };

      setError(validationError);
      setLoading(false);
      setOperation(null);

      return {
        data: null,
        error: validationError,
      };
    }

    const result = await generatePostText(
      parsed.data
    );

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setNotice(result.data.notice ?? null);
      setContext(result.data.context ?? null);
    }

    setLoading(false);
    setOperation(null);

    return result;
  }

  async function generate(
    input: GeneratePostInput
  ) {
    return run(
      {
        ...input,
        action: "generate",
        length: "standard",
        sourceText: undefined,
      },
      "generate"
    );
  }

  async function generateShort(
    input: GeneratePostInput
  ) {
    return run(
      {
        ...input,
        action: "generate",
        length: "short",
        sourceText: undefined,
      },
      "short"
    );
  }

  async function generateLong(
    input: GeneratePostInput
  ) {
    return run(
      {
        ...input,
        action: "generate",
        length: "long",
        sourceText: undefined,
      },
      "long"
    );
  }

  async function rewrite(
    input: GeneratePostInput,
    sourceText: string
  ) {
    return run(
      {
        ...input,
        action: "rewrite",
        length: "standard",
        sourceText,
      },
      "rewrite"
    );
  }

  async function addHashtags(
    input: GeneratePostInput,
    sourceText: string
  ) {
    return run(
      {
        ...input,
        action: "hashtags",
        length: "standard",
        sourceText,
      },
      "hashtags"
    );
  }

  async function addEmojis(
    input: GeneratePostInput,
    sourceText: string
  ) {
    return run(
      {
        ...input,
        action: "emojis",
        length: "standard",
        sourceText,
      },
      "emojis"
    );
  }

  async function useTemplate(
    input: GeneratePostInput
  ) {
    const provider = new TemplatesProvider();
    const data = await provider.generatePost(input);

    setError(null);
    setNotice(
      "Se utilizó una plantilla local editable."
    );
    setContext(data.context ?? null);
    setVersions(null);

    return data;
  }

  async function generateVersions(
    input: GeneratePostInput,
    count: AIPostVersionCount = 3
  ) {
    setLoading(true);
    setOperation("versions");
    setError(null);
    setNotice(null);
    setVersions(null);

    const parsed = generatePostTextSchema.safeParse({
      ...input,
      action: "generate",
      length: input.length ?? "standard",
      sourceText: undefined,
      versionCount: count,
    });

    if (!parsed.success) {
      const validationError: GeneratePostError = {
        code: "invalid_response",
        message:
          "Los datos del negocio o del menú están incompletos.",
        fallbackText: null,
      };

      setError(validationError);
      setLoading(false);
      setOperation(null);

      return {
        data: null,
        error: validationError,
      };
    }

    const result = await generatePostVersions(
      parsed.data
    );

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setNotice(result.data.notice ?? null);
      setContext(result.data.context ?? null);
      setVersions(result.data.versions);
    }

    setLoading(false);
    setOperation(null);

    return result;
  }

  function clearVersions() {
    setVersions(null);
  }

  return {
    error,
    notice,
    context,
    versions,
    loading,
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
  };
}
