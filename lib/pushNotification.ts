/**
 * Push 通知 & Google トークン管理
 *
 * ストレージ: Cloudflare KV（旧 Upstash Redis から移行）
 * 送信:       web-push ライブラリ（nodejs_compat で動作）
 */

import webpush from "web-push";
import { getKV } from "@/lib/cloudflareKV";

const SUBSCRIPTION_KEY = "er_push_subscription";
const GOOGLE_TOKEN_KEY  = "er_google_tokens";

/** base64url 正規化（+/= → -_） */
function toBase64Url(key: string): string {
  return key.trim().replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function initWebPush() {
  const pub  = toBase64Url(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  ?? "");
  const priv = toBase64Url(process.env.VAPID_PRIVATE_KEY             ?? "");
  const subj = process.env.VAPID_SUBJECT ?? "https://er-schedule-app.workers.dev";
  webpush.setVapidDetails(subj, pub, priv);
}

// ── Google Token Storage ──────────────────────────────────────────────

export async function saveGoogleTokens(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const kv = await getKV();
  if (!kv) return;
  await kv.put(
    GOOGLE_TOKEN_KEY,
    JSON.stringify({ accessToken, refreshToken, savedAt: Date.now() }),
    { expirationTtl: 60 * 60 * 24 * 30 }
  );
}

export async function getGoogleTokens(): Promise<{
  accessToken: string;
  refreshToken?: string;
  savedAt?: number;
} | null> {
  const kv = await getKV();
  if (!kv) return null;
  return kv.get<{ accessToken: string; refreshToken?: string; savedAt?: number }>(
    GOOGLE_TOKEN_KEY,
    "json"
  );
}

// ── Push Subscription Storage ─────────────────────────────────────────

export async function saveSubscription(subscription: object): Promise<void> {
  const kv = await getKV();
  if (!kv) throw new Error("Cloudflare KV が利用できません（ローカル環境）");
  await kv.put(SUBSCRIPTION_KEY, JSON.stringify(subscription));
}

export async function getSubscription(): Promise<webpush.PushSubscription | null> {
  const kv = await getKV();
  if (!kv) return null;
  return kv.get<webpush.PushSubscription>(SUBSCRIPTION_KEY, "json");
}

export async function hasSubscription(): Promise<boolean> {
  const kv = await getKV();
  if (!kv) return false;
  const val = await kv.get(SUBSCRIPTION_KEY);
  return val !== null;
}

// ── Send Push Notification ────────────────────────────────────────────

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
        icon:    "/icons/icon-192x192.png",
        badge:   "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        data:    { url: "/" },
      })
    );
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Push notification failed:", msg);
    return { ok: false, error: msg };
  }
}
