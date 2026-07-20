import { useEffect, useRef, useState } from "react";

import {
  createPhotosPickerSession,
  getPhotosPickerSessionStatus,
  importPhotosPickerSelection,
} from "../services/gallery.service";
import type {
  GooglePhotosConnectionError,
  ImportedMediaItem,
} from "../types/gallery";

export type PhotosPickerState =
  | "idle"
  | "waiting_selection"
  | "importing"
  | "done"
  | "error";

const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const MIN_POLL_INTERVAL_MS = 2000;

export function usePhotosPicker(
  workspaceId: string | null,
  onImported?: (items: ImportedMediaItem[]) => void
) {
  const [state, setState] =
    useState<PhotosPickerState>("idle");
  const [error, setError] =
    useState<GooglePhotosConnectionError | null>(null);
  const [importedCount, setImportedCount] =
    useState(0);
  const pollTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  async function pickPhotos() {
    if (!workspaceId) return;

    setError(null);
    setImportedCount(0);
    setState("waiting_selection");

    const session = await createPhotosPickerSession(
      workspaceId
    );

    if (!session.data) {
      setError(session.error);
      setState("error");
      return;
    }

    window.open(
      session.data.pickerUri,
      "_blank",
      "noopener,noreferrer"
    );

    pollSession(
      workspaceId,
      session.data.sessionId,
      Math.max(
        session.data.pollIntervalMs,
        MIN_POLL_INTERVAL_MS
      ),
      Date.now()
    );
  }

  function pollSession(
    currentWorkspaceId: string,
    sessionId: string,
    intervalMs: number,
    startedAt: number
  ) {
    pollTimeoutRef.current = setTimeout(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setError({
          code: "service_unavailable",
          message:
            "Se agotó el tiempo de espera para seleccionar fotos en Google Photos.",
        });
        setState("error");
        return;
      }

      const statusResult =
        await getPhotosPickerSessionStatus(
          currentWorkspaceId,
          sessionId
        );

      if (!statusResult.data) {
        setError(statusResult.error);
        setState("error");
        return;
      }

      if (!statusResult.data.mediaItemsSet) {
        pollSession(
          currentWorkspaceId,
          sessionId,
          intervalMs,
          startedAt
        );
        return;
      }

      setState("importing");

      const importResult =
        await importPhotosPickerSelection(
          currentWorkspaceId,
          sessionId
        );

      if (!importResult.data) {
        setError(importResult.error);
        setState("error");
        return;
      }

      setImportedCount(
        importResult.data.imported.length
      );
      setState("done");
      onImported?.(importResult.data.imported);
    }, intervalMs);
  }

  function reset() {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }

    setState("idle");
    setError(null);
    setImportedCount(0);
  }

  return {
    state,
    error,
    importedCount,
    pickPhotos,
    reset,
  };
}
