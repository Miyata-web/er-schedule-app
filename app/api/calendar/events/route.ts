/**
 * GET /api/calendar/events
 *
 * Google Calendar API（直接 fetch）で "ER業務" カレンダーの予定を取得する。
 * googleapis ライブラリは Edge Runtime 非対応のため、生 HTTP リクエストに置き換え済み。
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveGoogleTokens } from "@/lib/pushNotification";

const CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const CALENDAR_EVENTS_BASE =
  "https://www.googleapis.com/calendar/v3/calendars";

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

    // Cron が使えるようにトークンを KV に保存（fire & forget）
    saveGoogleTokens(session.accessToken, session.refreshToken).catch(() => {});

    const authHeader = { Authorization: `Bearer ${session.accessToken}` };

    // カレンダー一覧を取得して "ER業務" を検索
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

    // 検索範囲（JST）を決定
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam   = searchParams.get("end");

    let timeMin: string;
    let timeMax: string;

    if (startParam && endParam) {
      timeMin = new Date(`${startParam}T00:00:00+09:00`).toISOString();
      timeMax = new Date(`${endParam}T23:59:59+09:00`).toISOString();
    } else {
      // 今日（JST）
      const now     = new Date();
      const jstNow  = new Date(now.getTime() + 9 * 3600000 + now.getTimezoneOffset() * 60000);
      const y = jstNow.getUTCFullYear();
      const m = String(jstNow.getUTCMonth() + 1).padStart(2, "0");
      const d = String(jstNow.getUTCDate()).padStart(2, "0");
      timeMin = new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString();
      timeMax = new Date(`${y}-${m}-${d}T23:59:59+09:00`).toISOString();
    }

    const eventsUrl =
      `${CALENDAR_EVENTS_BASE}/${encodeURIComponent(erCal.id)}/events` +
      `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime`;

    const evRes = await fetch(eventsUrl, { headers: authHeader });
    if (!evRes.ok) {
      return NextResponse.json({ error: "予定の取得に失敗しました" }, { status: 500 });
    }
    const evData = await evRes.json() as {
      items?: Array<{
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?:   { dateTime?: string; date?: string };
        description?: string;
      }>;
    };

    const events = (evData.items ?? []).map((ev) => ({
      id:          ev.id,
      title:       ev.summary ?? "（タイトルなし）",
      start:       ev.start?.dateTime ?? ev.start?.date ?? "",
      end:         ev.end?.dateTime   ?? ev.end?.date   ?? "",
      description: ev.description ?? "",
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
