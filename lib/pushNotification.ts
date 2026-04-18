import webpush from "web-push";

const SUBSCRIPTION_KEY = "er_push_subscription";

function getRedis() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  };
}

/** Convert any base64 variant → base64url (no padding, URL-safe chars) */
function toBase64Url(key: string): string {
  return key.trim().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function initWebPush() {
  const vapidPublicKey  = toBase64Url(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  || "");
  const vapidPrivateKey = toBase64Url(process.env.VAPID_PRIVATE_KEY             || "");
  console.log(`[Push] VAPID pubkey length=${vapidPublicKey.length} first10=${vapidPublicKey.slice(0, 10)}`);
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://er-schedule-app.vercel.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function saveSubscription(subscription: object): Promise<void> {
  const { url, token } = getRedis();
  if (!url || !token) {
    throw new Error("Upstash環境変数が未設定です (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)");
  }
  const res = await fetch(`${url}/set/${SUBSCRIPTION_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([JSON.stringify(subscription)]),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upstash保存失敗 (${res.status}): ${text}`);
  }
}

export async function getSubscription(): Promise<webpush.PushSubscription | null> {
  const { url, token } = getRedis();
  const res = await fetch(`${url}/get/${SUBSCRIPTION_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.result) return null;

  try {
    const parsed = JSON.parse(data.result);
    // Stored as array format: ["stringified_subscription"]
    if (Array.isArray(parsed)) {
      return JSON.parse(parsed[0]) as webpush.PushSubscription;
    }
    // Stored as direct object or stringified object
    if (typeof parsed === "string") {
      return JSON.parse(parsed) as webpush.PushSubscription;
    }
    return parsed as webpush.PushSubscription;
  } catch {
    console.error("[Push] Failed to parse subscription from Redis");
    return null;
  }
}

export async function sendPushNotification(
  title: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const subscription = await getSubscription();
  if (!subscription) {
    return { ok: false, error: "subscription_not_found" };
  }

  try {
    initWebPush();
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        data: { url: "/" },
      })
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Push notification failed:", msg);
    return { ok: false, error: msg };
  }
}
