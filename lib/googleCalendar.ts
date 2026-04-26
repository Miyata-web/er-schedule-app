import { getGoogleTokens, saveGoogleTokens } from "./pushNotification";

/**
 * Refreshes the access token using the stored refresh token.
 * Returns the new access token, or null if refresh fails.
 */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the number of events in the "ER業務" calendar for today (JST).
 * Uses stored tokens in Upstash, refreshing if needed.
 * Returns 0 if tokens are unavailable or an error occurs.
 */
export async function fetchTodayEventCount(): Promise<number> {
  const tokens = await getGoogleTokens();
  if (!tokens?.accessToken) return 0;

  let accessToken = tokens.accessToken;

  // Always refresh to ensure token is valid
  if (tokens.refreshToken) {
    const newToken = await refreshAccessToken(tokens.refreshToken);
    if (newToken) {
      accessToken = newToken;
      await saveGoogleTokens(newToken, tokens.refreshToken);
    }
  }

  // Build today's JST time range
  const now      = new Date();
  const jstShift = 9 * 60 * 60 * 1000;
  const jstNow   = new Date(now.getTime() + jstShift + now.getTimezoneOffset() * 60 * 1000);
  const y  = jstNow.getUTCFullYear();
  const m  = String(jstNow.getUTCMonth() + 1).padStart(2, "0");
  const d  = String(jstNow.getUTCDate()).padStart(2, "0");
  const timeMin = encodeURIComponent(new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString());
  const timeMax = encodeURIComponent(new Date(`${y}-${m}-${d}T23:59:59+09:00`).toISOString());

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  try {
    // Get calendar list to find "ER業務"
    const listRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: authHeader }
    );
    if (!listRes.ok) return 0;
    const listData = await listRes.json();
    const erCal = (listData.items as Array<{ id: string; summary: string }> | undefined)
      ?.find((c) => c.summary === "ER業務");
    if (!erCal) return 0;

    // Fetch today's events
    const evRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(erCal.id)}/events` +
      `?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
      { headers: authHeader }
    );
    if (!evRes.ok) return 0;
    const evData = await evRes.json();
    return (evData.items as unknown[] | undefined)?.length ?? 0;
  } catch {
    return 0;
  }
}
