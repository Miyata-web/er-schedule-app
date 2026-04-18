import { NextResponse } from "next/server";
import { auth } from "@/auth";

const SUBSCRIPTION_KEY = "er_push_subscription";

function toBase64Url(key: string): string {
  return key.trim().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const vapidRaw   = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const vapidPriv  = process.env.VAPID_PRIVATE_KEY;
    const vapidNorm  = toBase64Url(vapidRaw);

    // Diagnostic: show key properties (public key is safe to partially expose)
    const vapidDiag = {
      rawLength:  vapidRaw.length,
      normLength: vapidNorm.length,
      first12:    vapidNorm.slice(0, 12),
      hasPlus:    vapidRaw.includes("+"),
      hasSlash:   vapidRaw.includes("/"),
      hasEquals:  vapidRaw.includes("="),
      hasSpace:   vapidRaw.includes(" "),
    };

    const envStatus = {
      upstashUrl:   !!redisUrl,
      upstashToken: !!redisToken,
      vapidPublic:  !!vapidRaw,
      vapidPrivate: !!vapidPriv,
    };

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ hasSubscription: false, envStatus, vapidDiag, error: "Upstash環境変数が未設定です" });
    }

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
            const parsed = JSON.parse(data.result);
            const sub = Array.isArray(parsed) ? JSON.parse(parsed[0]) : parsed;
            endpointPreview = sub?.endpoint ? sub.endpoint.substring(0, 60) + "..." : "(エンドポイントなし)";
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

    return NextResponse.json({ hasSubscription, endpointPreview, upstashOk, upstashError, envStatus, vapidDiag });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
