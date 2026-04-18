import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotification";

// Runs at 23:30 UTC = 8:30 AM JST
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const result = await sendPushNotification(
    "🌅 ER スケジュール - 今日の予定",
    `${today}の予定を確認してください。アプリを開いて今日のタスクをチェックしましょう。`
  );

  console.log(`[Cron/Morning] Notification result:`, result);
  return NextResponse.json({ success: result.ok, error: result.error, time: new Date().toISOString() });
}
