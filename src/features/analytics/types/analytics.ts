export interface InstagramInsights {
  username: string | null;
  followersCount: number | null;
  mediaCount: number | null;
  profilePictureUrl: string | null;
  periodDays: number;
  reach: number | null;
  profileViews: number | null;
  updatedAt: string;
}

export type AnalyticsErrorCode =
  | "not_connected"
  | "invalid_response"
  | "service_unavailable";

export interface AnalyticsError {
  code: AnalyticsErrorCode;
  message: string;
}
