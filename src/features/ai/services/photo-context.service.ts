import {
  getSignedUrl,
} from "@/features/media/services/media.service";
import type {
  GeneratePostInput,
} from "../types/ai";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type PhotoContext = NonNullable<
  GeneratePostInput["photo"]
>;

function isAllowedMimeType(
  value: string
): value is PhotoContext["mimeType"] {
  return ALLOWED_MIME_TYPES.includes(
    value as PhotoContext["mimeType"]
  );
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];

  for (let index = 0; index < bytes.length; index += 8192) {
    chunks.push(
      String.fromCharCode(
        ...bytes.subarray(index, index + 8192)
      )
    );
  }

  return btoa(chunks.join(""));
}

export async function getPhotoContext(
  filePath: string
): Promise<PhotoContext | null> {
  const { data, error } = await getSignedUrl(filePath);

  if (error || !data?.signedUrl) {
    return null;
  }

  try {
    const response = await fetch(data.signedUrl);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if (
      blob.size > MAX_PHOTO_BYTES ||
      !isAllowedMimeType(blob.type)
    ) {
      return null;
    }

    return {
      data: toBase64(await blob.arrayBuffer()),
      mimeType: blob.type,
    };
  } catch {
    return null;
  }
}
