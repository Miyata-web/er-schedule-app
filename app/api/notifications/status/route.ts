/**
 * GET /api/notifications/status
 * KV にプッシュサブスクリプションが保存されているか確認する。
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasSubscription } from "@/lib/pushNotification";
import { getKV } from "@/lib/cloudflareKV";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kv          = await getKV();
    const kvAvailable = kv !== null;
    const kvHasSub    = await hasSubscription();

    const envStatus = {
      kvAvailable,
      vapidPublic:  !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      vapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
      vapidSubject: !!process.env.VAPID_SUBJECT,
    };

    return NextResponse.json({
      hasSubscription: kvHasSub,
      kvOk: kvAvailable,
      envStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
