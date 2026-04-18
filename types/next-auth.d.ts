import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** Google OAuth access token for Calendar API calls */
    accessToken?: string;
    /** Set to "RefreshAccessTokenError" when refresh fails (user must re-login) */
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
