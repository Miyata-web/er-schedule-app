import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";
import { saveGoogleTokens } from "@/lib/pushNotification";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session as { error?: string }).error === "RefreshAccessTokenError") {
      return NextResponse.json({ error: "SessionExpired" }, { status: 401 });
    }
    if (!session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Save tokens to Upstash so cron jobs can access the calendar
    saveGoogleTokens(session.accessToken, session.refreshToken).catch(() => {});

    // Set up OAuth2 client with the user's access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // List all calendars to find "ER業務"
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];

    const erCalendar = calendars.find((cal) => cal.summary === "ER業務");

    if (!erCalendar || !erCalendar.id) {
      return NextResponse.json(
        {
          error: "ER業務カレンダーが見つかりませんでした",
          availableCalendars: calendars.map((c) => c.summary),
        },
        { status: 404 }
      );
    }

    // Parse optional start/end query params (YYYY-MM-DD format)
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start"); // YYYY-MM-DD
    const endParam   = searchParams.get("end");   // YYYY-MM-DD

    let startOfRange: Date;
    let endOfRange: Date;

    if (startParam && endParam) {
      // Use the provided date range (interpret as JST dates)
      startOfRange = new Date(`${startParam}T00:00:00+09:00`);
      endOfRange   = new Date(`${endParam}T23:59:59+09:00`);
    } else {
      // Default: today in JST
      // Vercel servers run on UTC, so we must calculate the JST date explicitly
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000;
      const jstNow = new Date(now.getTime() + jstOffset + now.getTimezoneOffset() * 60 * 1000);
      const year  = jstNow.getUTCFullYear();
      const month = String(jstNow.getUTCMonth() + 1).padStart(2, "0");
      const day   = String(jstNow.getUTCDate()).padStart(2, "0");
      startOfRange = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
      endOfRange   = new Date(`${year}-${month}-${day}T23:59:59+09:00`);
    }

    const eventsResponse = await calendar.events.list({
      calendarId: erCalendar.id,
      timeMin: startOfRange.toISOString(),
      timeMax: endOfRange.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (eventsResponse.data.items || []).map((event) => ({
      id: event.id,
      title: event.summary || "（タイトルなし）",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      description: event.description || "",
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "カレンダーの取得に失敗しました" },
      { status: 500 }
    );
  }
}
