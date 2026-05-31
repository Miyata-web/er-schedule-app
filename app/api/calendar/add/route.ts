/**
 * POST /api/calendar/add
 *
 * "ER業務" カレンダーに予定を追加する。
 * googleapis → 直接 fetch に置き換え済み（Edge Runtime 対応）。
 */

export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const CALENDAR_LIST_URL  = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const CALENDAR_EVENTS_BASE = "https://www.googleapis.com/calendar/v3/calendars";

interface AddEventBody {
  title:        string;
  date:         string; // YYYY-MM-DD
  startTime:    string; // HH:MM
  endTime:      string; // HH:MM
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
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

    const authHeader = { Authorization: `Bearer ${session.accessToken}` };

    // "ER業務" カレンダーを検索
    const listRes = await fetch(CALENDAR_LIST_URL, { headers: authHeader });
    if (!listRes.ok) {
      return NextResponse.json({ error: "カレンダー一覧の取得に失敗しました" }, { status: 500 });
    }
    const listData = await listRes.json() as { items?: Array<{ id: string; summary: string }> };
    const erCal = listData.items?.find((c) => c.summary === "ER業務");

    if (!erCal) {
      return NextResponse.json(
        {
          error: "ER業務カレンダーが見つかりませんでした",
          availableCalendars: listData.items?.map((c) => c.summary),
        },
        { status: 404 }
      );
    }

    // 予定を追加
    const insertUrl = `${CALENDAR_EVENTS_BASE}/${encodeURIComponent(erCal.id)}/events`;
    const insertRes = await fetch(insertUrl, {
      method:  "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary:     title,
        description: description ?? "",
        start: { dateTime: `${date}T${startTime}:00+09:00`, timeZone: "Asia/Tokyo" },
        end:   { dateTime: `${date}T${endTime}:00+09:00`,   timeZone: "Asia/Tokyo" },
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({}));
      console.error("Calendar insert failed:", err);
      return NextResponse.json({ error: "予定の追加に失敗しました" }, { status: 500 });
    }

    const ev = await insertRes.json() as {
      id: string;
      summary?: string;
      start?: { dateTime?: string };
      end?:   { dateTime?: string };
    };

    return NextResponse.json({
      success: true,
      event: {
        id:    ev.id,
        title: ev.summary,
        start: ev.start?.dateTime,
        end:   ev.end?.dateTime,
      },
    });
  } catch (error) {
    console.error("Error adding calendar event:", error);
    return NextResponse.json({ error: "予定の追加に失敗しました" }, { status: 500 });
  }
}
