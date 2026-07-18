export type InstagramActionType =
  | "status"
  | "connect"
  | "disconnect";

export interface InstagramConnectionStatus {
  connected: boolean;
  igUsername: string | null;
  igUserId: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
}

export interface InstagramConnectionInput {
  action: InstagramActionType;
  workspaceId: string;
  code?: string;
  redirectUri?: string;
}

export type InstagramErrorCode =
  | "invalid_response"
  | "not_configured"
  | "oauth_error"
  | "workspace_not_found"
  | "service_unavailable";

export interface InstagramConnectionError {
  code: InstagramErrorCode;
  message: string;
}

export type InstagramMediaType = "feed" | "stories";

export interface InstagramPublishResult {
  published: boolean;
  mediaId: string;
  mediaType: InstagramMediaType;
  permalink: string | null;
}
