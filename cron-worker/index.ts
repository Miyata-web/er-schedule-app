/**
 * Cloudflare Workers — Cron Trigger Worker
 *
 * ER スケジュールアプリの定期プッシュ通知をスケジュール実行する。
 * Vercel Crons の代替として、本 Worker が指定時刻に API エンドポイントを呼び出す。
 *
 * Cron スケジュール（UTC → JST）:
 *   "30 23 * * *" → 8:30  JST（朝のリマインダー）
 *   "0 6 * * *"  → 15:00 JST（午後のリマインダー）
 *   "0 11 * * *" → 20:00 JST（夜のリマインダー）
 *
 * デプロイ: cron-worker/ ディレクトリで `wrangler deploy`
 */

interface Env {
  APP_URL:     string; // 例: https://er-schedule-app.pages.dev
  CRON_SECRET: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const cronToPath: Record<string, string> = {
      "30 23 * * *": "/api/cron/morning",
      "0 6 * * *":   "/api/cron/afternoon",
      "0 11 * * *":  "/api/cron/evening",
    };

    const path = cronToPath[event.cron];
    if (!path) {
      console.warn(`[CronWorker] Unknown cron expression: ${event.cron}`);
      return;
    }

    const url = `${env.APP_URL}${path}`;
    console.log(`[CronWorker] Calling ${url}`);

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      });
      const body = await res.text();
      console.log(`[CronWorker] ${path} → ${res.status}: ${body}`);
    } catch (e) {
      console.error(`[CronWorker] Failed to call ${path}:`, e);
    }
  },
};
