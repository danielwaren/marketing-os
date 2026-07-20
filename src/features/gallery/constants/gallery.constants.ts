// Client ID público de OAuth (Google Cloud Console → Credentials).
export const GOOGLE_PHOTOS_CLIENT_ID =
  "705166723362-jlea8q908gmjjbl2pedknv48fdnt4o8t.apps.googleusercontent.com";

export const GOOGLE_OAUTH_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

export const GOOGLE_PHOTOS_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
