import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the
   * `SessionProvider` React Context
   */
  interface Session {
    /** Google OAuth access token for Calendar API calls */
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** Google OAuth access token */
    accessToken?: string;
    /** Google OAuth refresh token */
    refreshToken?: string;
    /** Token expiry timestamp (seconds since epoch) */
    expiresAt?: number;
  }
}
