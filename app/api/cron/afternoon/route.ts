import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotification";

// Runs at 06:00 UTC = 3:00 PM JST
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const success = await sendPushNotification(
    "⏰ ER スケジュール - 午後のリマインダー",
    "未完了のタスクを確認してください。残りの業務をチェックしましょう。"
  );

  console.log(`[Cron/Afternoon] Notification sent: ${success}`);
  return NextResponse.json({ success, time: new Date().toISOString() });
}
