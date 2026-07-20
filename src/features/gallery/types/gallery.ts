export type GooglePhotosActionType =
  | "status"
  | "connect"
  | "disconnect";

export interface GooglePhotosConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  connectedAt: string | null;
  tokenExpiresAt: string | null;
}

export interface GooglePhotosConnectionInput {
  action: GooglePhotosActionType;
  workspaceId: string;
  code?: string;
  redirectUri?: string;
}

export type GooglePhotosErrorCode =
  | "invalid_response"
  | "not_configured"
  | "oauth_error"
  | "workspace_not_found"
  | "service_unavailable";

export interface GooglePhotosConnectionError {
  code: GooglePhotosErrorCode;
  message: string;
}

export type PickerActionType =
  | "create-session"
  | "session-status"
  | "import";

export interface PickerActionInput {
  action: PickerActionType;
  workspaceId: string;
  sessionId?: string;
}

export interface PickerSessionResult {
  sessionId: string;
  pickerUri: string;
  pollIntervalMs: number;
}

export interface PickerSessionStatus {
  mediaItemsSet: boolean;
}

export interface ImportedMediaItem {
  id: string;
  file_name: string;
  file_path: string;
}

export interface PickerImportResult {
  imported: ImportedMediaItem[];
}
