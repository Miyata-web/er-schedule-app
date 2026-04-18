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
    const result = await sendPushNotification(
      "🏥 ER スケジュール - テスト通知",
      `通知のテストです。現在時刻: ${now}`
    );

    if (!result.ok) {
      const isNotFound = result.error === "subscription_not_found";
      return NextResponse.json(
        {
          error: isNotFound
            ? "サブスクリプションが見つかりません。通知を許可してください。"
            : `通知送信失敗: ${result.error}`,
        },
        { status: isNotFound ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Push] Test error:", msg);
    return NextResponse.json({ error: `テストエラー: ${msg}` }, { status: 500 });
  }
}
