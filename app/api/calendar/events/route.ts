import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get today's events
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const eventsResponse = await calendar.events.list({
      calendarId: erCalendar.id,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
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
