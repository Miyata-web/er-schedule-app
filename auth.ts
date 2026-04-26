import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First login: save all tokens from Google
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at, // seconds since epoch
        };
      }

      // Access token still valid (with 60-second buffer)
      const expiresAt = (token.expiresAt ?? 0) as number;
      if (Date.now() < expiresAt * 1000 - 60_000) {
        return token;
      }

      // Token expired — try to refresh using refresh token
      if (!token.refreshToken) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        });

        const refreshed = await response.json();

        if (!response.ok) {
          console.error("[Auth] Token refresh failed:", refreshed);
          return { ...token, error: "RefreshAccessTokenError" };
        }

        console.log("[Auth] Access token refreshed successfully");
        return {
          ...token,
          accessToken: refreshed.access_token,
          // Google may or may not return a new refresh token
          refreshToken: (refreshed.refresh_token as string | undefined) ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
          error: undefined,
        };
      } catch (err) {
        console.error("[Auth] Token refresh exception:", err);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken  = token.accessToken  as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      // Surface token refresh errors so the UI can prompt re-login
      if (token.error) {
        session.error = token.error as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
