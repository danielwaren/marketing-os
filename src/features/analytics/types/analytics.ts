export interface InstagramEngagement {
  totalInteractions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  accountsEngaged: number | null;
}

export interface ReachByFollowType {
  follower: number | null;
  nonFollower: number | null;
  unknown: number | null;
}

export interface InstagramInsights {
  username: string | null;
  followersCount: number | null;
  mediaCount: number | null;
  profilePictureUrl: string | null;
  periodDays: number;
  reach: number | null;
  profileViews: number | null;
  reachByFollowType: ReachByFollowType;
  engagement: InstagramEngagement;
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
