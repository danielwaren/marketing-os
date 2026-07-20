import { useEffect, useRef, useState } from "react";

import {
  GOOGLE_OAUTH_AUTHORIZE_URL,
  GOOGLE_PHOTOS_CLIENT_ID,
  GOOGLE_PHOTOS_OAUTH_SCOPES,
} from "../constants/gallery.constants";
import {
  connectGooglePhotos,
  disconnectGooglePhotos,
  getGooglePhotosStatus,
} from "../services/gallery.service";
import type {
  GooglePhotosConnectionError,
  GooglePhotosConnectionStatus,
} from "../types/gallery";

function getRedirectUri() {
  return `${window.location.origin}/app/gallery`;
}

export function buildGoogleAuthorizeUrl() {
  const params = [
    `client_id=${GOOGLE_PHOTOS_CLIENT_ID}`,
    `redirect_uri=${encodeURIComponent(getRedirectUri())}`,
    "response_type=code",
    `scope=${encodeURIComponent(GOOGLE_PHOTOS_OAUTH_SCOPES)}`,
    "access_type=offline",
    "prompt=consent",
  ].join("&");

  return `${GOOGLE_OAUTH_AUTHORIZE_URL}?${params}`;
}

export function useGooglePhotosConnection(
  workspaceId: string | null
) {
  const [status, setStatus] =
    useState<GooglePhotosConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] =
    useState<GooglePhotosConnectionError | null>(null);
  const consumedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(
      window.location.search
    );
    const code = params.get("code");

    if (code) {
      if (consumedCodeRef.current === code) {
        return;
      }

      consumedCodeRef.current = code;

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );

      handleOAuthCallback(code);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function refresh() {
    if (!workspaceId) return;

    setLoading(true);

    const result = await getGooglePhotosStatus(
      workspaceId
    );

    if (result.data) {
      setStatus(result.data);
      setError(null);
    } else if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  }

  async function handleOAuthCallback(code: string) {
    if (!workspaceId) return;

    setConnecting(true);
    setError(null);

    const result = await connectGooglePhotos(
      workspaceId,
      code,
      getRedirectUri()
    );

    if (result.data) {
      setStatus(result.data);
    } else if (result.error) {
      setError(result.error);
    }

    setConnecting(false);
    setLoading(false);
  }

  function connect() {
    window.location.href = buildGoogleAuthorizeUrl();
  }

  async function disconnect() {
    if (!workspaceId) return;

    setConnecting(true);

    const result = await disconnectGooglePhotos(
      workspaceId
    );

    if (result.data) {
      setStatus(result.data);
      setError(null);
    } else if (result.error) {
      setError(result.error);
    }

    setConnecting(false);
  }

  return {
    status,
    loading,
    connecting,
    error,
    connect,
    disconnect,
    refresh,
  };
}
