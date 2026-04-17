import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

interface AddEventBody {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AddEventBody = await request.json();
    const { title, date, startTime, endTime, description } = body;

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています (title, date, startTime, endTime)" },
        { status: 400 }
      );
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

    // Build the event start and end times with timezone (JST = UTC+9)
    const startDateTime = `${date}T${startTime}:00+09:00`;
    const endDateTime = `${date}T${endTime}:00+09:00`;

    const event = await calendar.events.insert({
      calendarId: erCalendar.id,
      requestBody: {
        summary: title,
        description: description || "",
        start: {
          dateTime: startDateTime,
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "Asia/Tokyo",
        },
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.data.id,
        title: event.data.summary,
        start: event.data.start?.dateTime,
        end: event.data.end?.dateTime,
      },
    });
  } catch (error) {
    console.error("Error adding calendar event:", error);
    return NextResponse.json(
      { error: "予定の追加に失敗しました" },
      { status: 500 }
    );
  }
}
