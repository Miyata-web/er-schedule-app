import webpush from "web-push";

const SUBSCRIPTION_KEY = "er_push_subscription";

function getRedis() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  };
}

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://er-schedule-app.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export async function saveSubscription(subscription: object): Promise<void> {
  const { url, token } = getRedis();
  await fetch(`${url}/set/${SUBSCRIPTION_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([JSON.stringify(subscription)]),
  });
}

export async function getSubscription(): Promise<webpush.PushSubscription | null> {
  const { url, token } = getRedis();
  const res = await fetch(`${url}/get/${SUBSCRIPTION_KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.result) return null;
  return JSON.parse(data.result) as webpush.PushSubscription;
}

export async function sendPushNotification(
  title: string,
  body: string
): Promise<boolean> {
  const subscription = await getSubscription();
  if (!subscription) return false;

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
    return true;
  } catch (error) {
    console.error("Push notification failed:", error);
    return false;
  }
}
