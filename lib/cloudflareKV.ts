/**
 * Cloudflare KV アクセスヘルパー（OpenNext 対応）
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare KV の ER_KV バインディングを取得する。
 * ローカル開発や KV 未設定環境では null を返す。
 */
export async function getKV(): Promise<KVNamespace | null> {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx.env as Record<string, unknown>;
    const kv  = env["ER_KV"];
    return (kv as KVNamespace) ?? null;
  } catch {
    return null;
  }
}
