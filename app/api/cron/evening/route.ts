import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotification";
import { fetchTodayEventCount } from "@/lib/googleCalendar";

// Runs at 11:00 UTC = 8:00 PM JST
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await fetchTodayEventCount();
  console.log(`[Cron/Evening] Today's event count: ${count}`);

  if (count === 0) {
    return NextResponse.json({ skipped: true, reason: "no_events_today" });
  }

  const result = await sendPushNotification(
    "🌙 ER スケジュール - 夜のリマインダー",
    `本日${count}件の予定があります。業務終了前に確認してください。`
  );

  console.log(`[Cron/Evening] Notification result:`, result);
  return NextResponse.json({ success: result.ok, error: result.error, count, time: new Date().toISOString() });
}
