import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SUBSCRIPTION_KEY = "er_push_subscription";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const vapidKey   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPriv  = process.env.VAPID_PRIVATE_KEY;

    // Check env vars
    const envStatus = {
      upstashUrl:   !!redisUrl,
      upstashToken: !!redisToken,
      vapidPublic:  !!vapidKey,
      vapidPrivate: !!vapidPriv,
    };

    if (!redisUrl || !redisToken) {
      return NextResponse.json({
        hasSubscription: false,
        envStatus,
        error: "Upstash環境変数が未設定です",
      });
    }

    // Try fetching subscription from Upstash
    let upstashOk = false;
    let hasSubscription = false;
    let endpointPreview = "";
    let upstashError = "";

    try {
      const res = await fetch(`${redisUrl}/get/${SUBSCRIPTION_KEY}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: "no-store",
      });
      upstashOk = res.ok;

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          hasSubscription = true;
          try {
            const sub = JSON.parse(data.result);
            endpointPreview = sub.endpoint
              ? sub.endpoint.substring(0, 50) + "..."
              : "(エンドポイントなし)";
          } catch {
            endpointPreview = "(パース失敗)";
          }
        }
      } else {
        upstashError = `HTTP ${res.status}`;
      }
    } catch (e) {
      upstashError = String(e);
    }

    return NextResponse.json({
      hasSubscription,
      endpointPreview,
      upstashOk,
      upstashError,
      envStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
