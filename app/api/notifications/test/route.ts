import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushNotification } from "@/lib/pushNotification";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" });
    const success = await sendPushNotification(
      "🏥 ER スケジュール - テスト通知",
      `通知のテストです。現在時刻: ${now}`
    );

    if (!success) {
      return NextResponse.json(
        { error: "サブスクリプションが見つかりません。通知を許可してください。" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Test error:", error);
    return NextResponse.json({ error: "通知の送信に失敗しました" }, { status: 500 });
  }
}
