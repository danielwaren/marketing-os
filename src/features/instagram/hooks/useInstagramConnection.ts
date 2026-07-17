import { useEffect, useState } from "react";

import {
  INSTAGRAM_APP_ID,
  INSTAGRAM_AUTHORIZE_URL,
  INSTAGRAM_OAUTH_SCOPES,
} from "../constants/instagram.constants";
import {
  connectInstagram,
  disconnectInstagram,
  getInstagramStatus,
} from "../services/instagram.service";
import type {
  InstagramConnectionError,
  InstagramConnectionStatus,
} from "../types/instagram";

function getRedirectUri() {
  return `${window.location.origin}/app/instagram`;
}

export function buildInstagramAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: INSTAGRAM_OAUTH_SCOPES,
  });

  return `${INSTAGRAM_AUTHORIZE_URL}?${params.toString()}`;
}

export function useInstagramConnection(
  workspaceId: string | null
) {
  const [status, setStatus] =
    useState<InstagramConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] =
    useState<InstagramConnectionError | null>(null);

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
      handleOAuthCallback(code);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function refresh() {
    if (!workspaceId) return;

    setLoading(true);

    const result = await getInstagramStatus(workspaceId);

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

    const result = await connectInstagram(
      workspaceId,
      code,
      getRedirectUri()
    );

    window.history.replaceState(
      {},
      "",
      window.location.pathname
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
    window.location.href = buildInstagramAuthorizeUrl();
  }

  async function disconnect() {
    if (!workspaceId) return;

    setConnecting(true);

    const result = await disconnectInstagram(workspaceId);

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
